import fs from 'fs';
import path from 'path';
import StreamZip from 'node-stream-zip';
import xlsx from 'xlsx';
import removeAccents from 'remove-accents';

function normalizeName(name) {
  return removeAccents(name.toLowerCase().trim());
}

function mapResult(name, data) {
  return {
    food_name: name,
    energy_kcal: data.energy_kcal,
    proteins_g: data.proteins_g,
    carbohydrates_g: data.carbohydrates_g,
    fat_g: data.fat_g,
    sugars_g: data.sugars_g,
    fiber_g: data.fiber_g,
    salt_g: data.salt_g
  };
}

function isComplete(obj) {
  return obj && obj.energy_kcal && obj.proteins_g != null && obj.carbohydrates_g != null && obj.fat_g != null;
}

// ------------------ OPEN FOOD FACTS ------------------
export async function searchOpenFoodFacts(food) {
  const url =
    'https://world.openfoodfacts.org/cgi/search.pl?search_terms=' +
    encodeURIComponent(food) +
    '&search_simple=1&action=process&json=1&fields=product_name,nutriments';
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const products = data.products || [];
    if (products.length === 0) return null;
    const norm = normalizeName(food);
    let prod = products.find(p => normalizeName(p.product_name || '') === norm);
    if (!prod) prod = products[0];
    const nutr = prod.nutriments || {};
    const result = mapResult(prod.product_name, {
      energy_kcal: nutr['energy-kcal_100g'],
      proteins_g: nutr.proteins_100g,
      carbohydrates_g: nutr.carbohydrates_100g,
      fat_g: nutr.fat_100g,
      sugars_g: nutr.sugars_100g,
      fiber_g: nutr.fiber_100g,
      salt_g: nutr.salt_100g
    });
    return result;
  } catch {
    return null;
  }
}

// ------------------ CIQUAL ------------------
let ciqualCache = null;
function loadCiqual() {
  if (ciqualCache) return ciqualCache;
  const filePath = path.join('data', 'Table Ciqual 2020_FR_2020 07 07.xls');
  if (!fs.existsSync(filePath)) {
    throw new Error('Ciqual file missing');
  }
  const wb = xlsx.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });
  ciqualCache = rows.map(r => ({
    food_name: r['alim_nom_fr'],
    energy_kcal: parseFloat(String(r['Energie, R\u00e8glement UE N\u00b0 1169/2011 (kcal/100 g)']).replace(',', '.')),
    proteins_g: parseFloat(String(r['Prot\u00e9ines, N x facteur de Jones (g/100 g)']).replace(',', '.')),
    carbohydrates_g: parseFloat(String(r['Glucides (g/100 g)']).replace(',', '.')),
    fat_g: parseFloat(String(r['Lipides (g/100 g)']).replace(',', '.')),
    sugars_g: parseFloat(String(r['Sucres (g/100 g)']).replace(',', '.')),
    fiber_g: parseFloat(String(r['Fibres alimentaires (g/100 g)']).replace(',', '.')),
    salt_g: parseFloat(String(r['Sel chlorure de sodium (g/100 g)']).replace(',', '.')),
    _norm: normalizeName(r['alim_nom_fr'])
  }));
  return ciqualCache;
}

export function searchCiqual(food) {
  try {
    const data = loadCiqual();
    const norm = normalizeName(food);
    let entry = data.find(d => d._norm === norm);
    if (!entry) entry = data.find(d => d._norm.includes(norm));
    if (!entry) return null;
    const { _norm, ...rest } = entry;
    return rest;
  } catch {
    return null;
  }
}

// ------------------ FINELI ------------------
let fineliCache = null;
async function loadFineli() {
  if (fineliCache) return fineliCache;
  const filePath = path.join('data', 'Fineli_Rel20__74_ravintotekij__.zip');
  if (!fs.existsSync(filePath)) {
    throw new Error('Fineli file missing');
  }
  const zip = new StreamZip.async({ file: filePath });
  const namesBuf = await zip.entryData('foodname_EN.csv');
  const valuesBuf = await zip.entryData('component_value.csv');
  await zip.close();
  const names = namesBuf.toString('utf-8').split(/\r?\n/);
  const idToName = {};
  for (const line of names.slice(1)) {
    if (!line) continue;
    const [id, name] = line.split(';');
    idToName[id] = name;
  }
  const vals = valuesBuf.toString('utf-8').split(/\r?\n/);
  const foods = {};
  for (const line of vals.slice(1)) {
    if (!line) continue;
    const [id, comp, val] = line.split(';');
    if (!foods[id]) foods[id] = {};
    foods[id][comp] = parseFloat(val.replace(',', '.'));
  }
  fineliCache = Object.keys(idToName).map(id => {
    const v = foods[id] || {};
    return {
      food_name: idToName[id],
      energy_kcal: v.ENERC ? v.ENERC / 4.184 : undefined,
      proteins_g: v.PROT,
      carbohydrates_g: v.CHOCDF || v.CHOAVL,
      fat_g: v.FAT,
      sugars_g: v.SUGAR,
      fiber_g: v.FIBC,
      salt_g: v.NACL ? v.NACL / 1000 : undefined, // mg -> g
      _norm: normalizeName(idToName[id])
    };
  });
  return fineliCache;
}

export async function searchFineli(food) {
  try {
    const data = await loadFineli();
    const norm = normalizeName(food);
    let entry = data.find(d => d._norm === norm);
    if (!entry) entry = data.find(d => d._norm.includes(norm));
    if (!entry) return null;
    const { _norm, ...rest } = entry;
    return rest;
  } catch {
    return null;
  }
}

// ------------------ MAIN FUNCTION ------------------
export async function find_and_suggest_food(food_name) {
  let res = await searchOpenFoodFacts(food_name);
  if (isComplete(res)) return { ...res, source: 'openfoodfacts' };
  res = searchCiqual(food_name);
  if (res) return { ...res, source: 'ciqual' };
  res = await searchFineli(food_name);
  if (res) return { ...res, source: 'fineli' };
  return null;
}
