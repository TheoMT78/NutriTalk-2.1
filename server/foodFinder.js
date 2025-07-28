import fs from 'fs';
import path from 'path';
import StreamZip from 'node-stream-zip';
import xlsx from 'xlsx';
import removeAccents from 'remove-accents';
import { findBestMatch } from 'string-similarity';

// Simple synonym dictionary for common foods
export const synonyms = {
  oeuf: ['oeuf', 'œuf', 'oeufs', 'œufs', 'egg', 'oeuf dur', 'œuf dur', 'oeufs durs', 'œufs durs'],
  'pomme de terre': ['pomme de terre', 'pommes de terre', 'patate', 'patates'],
  banane: ['banane', 'bananes'],
  fraise: ['fraise', 'fraises'],
  'flocons d\'avoine': ['flocon d\'avoine', 'flocons d\'avoine', 'avoine']
};

// Return possible variants (synonyms) for a given name
function getVariants(name) {
  const norm = normalizeName(name);
  for (const list of Object.values(synonyms)) {
    const normalized = list.map(n => normalizeName(n));
    if (normalized.includes(norm)) return list;
  }
  return [name];
}

// Normalize food names to ease comparisons
// - remove accents
// - unify œ/oe
// - lowercase
// - remove common punctuation and extra spaces
// - strip a trailing 's' for plurals
export function normalizeName(name) {
  if (!name) return '';
  let n = name.toLowerCase();
  n = n.replace(/œ/g, 'oe');
  n = removeAccents(n);
  n = n.replace(/[.,;!?'"()]/g, '');
  n = n.replace(/\s+/g, ' ').trim();
  if (n.endsWith('s')) n = n.slice(0, -1);
  return n;
}

const UNITS = {
  energy_kcal: 'kcal/100g',
  proteins_g: 'g/100g',
  carbohydrates_g: 'g/100g',
  fat_g: 'g/100g',
  sugars_g: 'g/100g',
  fiber_g: 'g/100g',
  salt_g: 'g/100g'
};

// Map raw data from a source to the unified structure with units
function mapResult(name, data) {
  return {
    food_name: name,
    energy_kcal: data.energy_kcal,
    proteins_g: data.proteins_g,
    carbohydrates_g: data.carbohydrates_g,
    fat_g: data.fat_g,
    sugars_g: data.sugars_g,
    fiber_g: data.fiber_g,
    salt_g: data.salt_g,
    units: UNITS
  };
}

function isComplete(obj) {
  return obj && obj.energy_kcal && obj.proteins_g != null && obj.carbohydrates_g != null && obj.fat_g != null;
}

// ------------------ OPEN FOOD FACTS ------------------
/**
 * Search a specific food in OpenFoodFacts and return the best match.
 */
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

/**
 * Suggest multiple foods from OpenFoodFacts matching the query.
 */
export async function suggestOpenFoodFacts(query) {
  const url =
    'https://world.openfoodfacts.org/cgi/search.pl?search_terms=' +
    encodeURIComponent(query) +
    '&search_simple=1&action=process&json=1&page_size=20&fields=product_name,nutriments';
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const products = data.products || [];
    const norm = normalizeName(query);
    let results = products
      .filter(p => normalizeName(p.product_name || '').includes(norm))
      .map(p => {
        const nutr = p.nutriments || {};
        return mapResult(p.product_name, {
          energy_kcal: nutr['energy-kcal_100g'],
          proteins_g: nutr.proteins_100g,
          carbohydrates_g: nutr.carbohydrates_100g,
          fat_g: nutr.fat_100g,
          sugars_g: nutr.sugars_100g,
          fiber_g: nutr.fiber_100g,
          salt_g: nutr.salt_100g
        });
      });
    if (results.length === 0 && products.length) {
      const names = products.map(p => normalizeName(p.product_name || ''));
      const matches = findBestMatch(norm, names).ratings.filter(r => r.rating >= 0.6);
      results = matches.map(m => {
        const p = products[names.indexOf(m.target)];
        const nutr = p.nutriments || {};
        return mapResult(p.product_name, {
          energy_kcal: nutr['energy-kcal_100g'],
          proteins_g: nutr.proteins_100g,
          carbohydrates_g: nutr.carbohydrates_100g,
          fat_g: nutr.fat_100g,
          sugars_g: nutr.sugars_100g,
          fiber_g: nutr.fiber_100g,
          salt_g: nutr.salt_100g
        });
      });
    }
    return results;
  } catch {
    return [];
  }
}

/**
 * Query the USDA FoodData Central API for foods matching the query.
 */
export async function searchUsda(query) {
  const apiKey = process.env.USDA_API_KEY;
  if (!apiKey) return [];
  const params = new URLSearchParams({
    api_key: apiKey,
    query,
    pageSize: '20',
    dataType: ['Foundation', 'SR Legacy']
  });
  const url = 'https://api.nal.usda.gov/fdc/v1/foods/search?' + params.toString();
  try {
    const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
    if (!res.ok) return [];
    const data = await res.json();
    const foods = data.foods || [];
    const results = foods.map(f => {
      const n = f.foodNutrients || [];
      const getVal = num => {
        const found = n.find(nn => String(nn.nutrientNumber) === String(num));
        return found ? parseFloat(found.value) : undefined;
      };
      return mapResult(f.description, {
        energy_kcal: getVal(1008),
        proteins_g: getVal(1003),
        carbohydrates_g: getVal(1005),
        fat_g: getVal(1004),
        sugars_g: getVal(2000),
        fiber_g: getVal(1079),
        salt_g: getVal(1093) ? getVal(1093) / 1000 : undefined // mg -> g
      });
    });
    return results;
  } catch {
    return [];
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
    const variants = getVariants(food);
    let entry = null;
    for (const v of variants) {
      const n = normalizeName(v);
      entry = data.find(d => d._norm === n) || data.find(d => d._norm.includes(n));
      if (entry) break;
    }
    if (!entry) {
      const names = data.map(d => d._norm);
      const { bestMatch, bestMatchIndex } = findBestMatch(normalizeName(food), names);
      if (bestMatch.rating >= 0.7) entry = data[bestMatchIndex];
    }
    if (!entry) return null;
    const { _norm, ...rest } = entry;
    return mapResult(rest.food_name, rest);
  } catch (e) {
    console.error(e);
    return null;
  }
}

/**
 * Return all Ciqual foods whose name matches the query.
 */
export function searchCiqualMany(query) {
  try {
    const data = loadCiqual();
    const norm = normalizeName(query);
    let entries = data.filter(d => d._norm.includes(norm));
    if (entries.length === 0) {
      const names = data.map(d => d._norm);
      const matches = findBestMatch(norm, names).ratings.filter(r => r.rating >= 0.6);
      entries = matches.map(m => data[names.indexOf(m.target)]);
    }
    return entries.map(({ _norm, ...rest }) => mapResult(rest.food_name, rest));
  } catch {
    return [];
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
    const variants = getVariants(food);
    let entry = null;
    for (const v of variants) {
      const n = normalizeName(v);
      entry = data.find(d => d._norm === n) || data.find(d => d._norm.includes(n));
      if (entry) break;
    }
    if (!entry) {
      const names = data.map(d => d._norm);
      const { bestMatch, bestMatchIndex } = findBestMatch(normalizeName(food), names);
      if (bestMatch.rating >= 0.7) entry = data[bestMatchIndex];
    }
    if (!entry) return null;
    const { _norm, ...rest } = entry;
    return mapResult(rest.food_name, rest);
  } catch (e) {
    console.error(e);
    return null;
  }
}

/**
 * Return all Fineli foods matching the query.
 */
export async function searchFineliMany(query) {
  try {
    const data = await loadFineli();
    const norm = normalizeName(query);
    let entries = data.filter(d => d._norm.includes(norm));
    if (entries.length === 0) {
      const names = data.map(d => d._norm);
      const matches = findBestMatch(norm, names).ratings.filter(r => r.rating >= 0.6);
      entries = matches.map(m => data[names.indexOf(m.target)]);
    }
    return entries.map(({ _norm, ...rest }) => mapResult(rest.food_name, rest));
  } catch {
    return [];
  }
}

// ------------------ MAIN FUNCTION ------------------
export async function find_and_suggest_food(food_name) {
  const variants = getVariants(food_name);
  for (const v of variants) {
    const res = await searchOpenFoodFacts(v);
    if (isComplete(res)) return { ...res, source: 'openfoodfacts' };
  }
  const ciqualRes = searchCiqual(food_name);
  if (ciqualRes) return { ...ciqualRes, source: 'ciqual' };
  const fineliRes = await searchFineli(food_name);
  if (fineliRes) return { ...fineliRes, source: 'fineli' };
  return null;
}

/**
 * Advanced search returning multiple suggestions following the order:
 * OpenFoodFacts -> USDA -> local Excel/CSV data.
 */
export async function advancedFoodSearch(query) {
  let results = await suggestOpenFoodFacts(query);
  if (results.length) return results.map(r => ({ ...r, source: 'openfoodfacts' }));

  results = await searchUsda(query);
  if (results.length) return results.map(r => ({ ...r, source: 'usda' }));

  results = searchCiqualMany(query).map(r => ({ ...r, source: 'ciqual' }));
  if (results.length) return results;

  results = await searchFineliMany(query);
  return results.map(r => ({ ...r, source: 'fineli' }));
}
