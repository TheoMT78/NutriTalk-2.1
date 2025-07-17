import { ParsedFood } from '../types';
import { parseWithLLM } from './llmParser';

// Some common mistakes or phonetic variants to map back to real foods
const nameAliases: Record<string, string> = {
  'beurre cut keke wet': 'beurre de cacahuete',
  'beurre cut kéké wet': 'beurre de cacahuete',
  'beurre cut': 'beurre de cacahuete',
  'keke wet': 'beurre de cacahuete',
  'peanut butter': 'beurre de cacahuete',
  'beurre cacahuete': 'beurre de cacahuete',
  'beurre cacahuète': 'beurre de cacahuete',
  'flocon avoine': 'flocons d\'avoine',
  'flocon d\'avoine': 'flocons d\'avoine',
  'farine avoine': 'farine d\'avoine',
  'oatmeal': 'flocons d\'avoine'
};

const wordNumbers: Record<string, number> = {
  un: 1,
  une: 1,
  deux: 2,
  trois: 3,
  quatre: 4,
  cinq: 5,
  six: 6,
  sept: 7,
  huit: 8,
  neuf: 9,
  dix: 10
};

function normalizeUnit(u?: string): string {
  if (!u) return 'unite';
  const unit = u.toLowerCase();
  if (['kg'].includes(unit)) return 'g';
  if (['g', 'gr', 'gramme', 'grammes'].includes(unit)) return 'g';
  if (['l'].includes(unit)) return 'ml';
  if (['ml', 'cl'].includes(unit)) return 'ml';
  if (/soupe/.test(unit) || ['cas', 'càs'].includes(unit)) return 'cas';
  if (/cafe/.test(unit) || ['cac', 'càc'].includes(unit)) return 'cac';
  if (/piece/.test(unit) || /tranche/.test(unit) || /sachet/.test(unit) || /pot/.test(unit)) return 'unite';
  return unit;
}

function capitalize(str: string): string {
  return str
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export async function parseFoods(text: string): Promise<ParsedFood[]> {
  const llm = await parseWithLLM(text);
  if (llm && llm.length > 0) return llm;
  const numWords = ['un', 'une', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix'];
  const connectors = ['et', 'avec', 'puis', 'alors'];

  const cleaned = text
    .toLowerCase()
    // split tokens like "100g" or "2ml" into "100 g" so quantities are detected
    .replace(/(\d+(?:[.,]\d+)?)([a-zà-ÿ]+)/gi, '$1 $2');

  const tokens = cleaned.split(/\s+/);
  const segments: string[] = [];
  let current = '';
  let started = false;

  for (const tok of tokens) {
    const isNum = /^\d+(?:[.,]\d+)?$/.test(tok) || numWords.includes(tok);
    const isConn = connectors.includes(tok);

    if (isNum) {
      if (started && current.trim()) segments.push(current.trim());
      current = tok;
      started = true;
    } else if (isConn) {
      if (started && current.trim()) segments.push(current.trim());
      current = '';
    } else {
      current += (current ? ' ' : '') + tok;
    }
  }

  if (current.trim()) segments.push(current.trim());

  const foods: ParsedFood[] = [];

  const pattern = /^(?<qty>\d+(?:[.,]\d+)?|un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix)?\s*(?<unit>kg|g|gr|grammes?|ml|cl|l|càs|cas|càc|cac|cuill(?:\w+)?\s+à\s+(?:soupe|café)|pi(?:e|é)ces?|tranches?|sachets?|pots?)?\s*(?:de\s+|d')?(?<name>.+)$/i;

  const brandList = [
    'myprotein',
    'prozis',
    'bulk',
    'auchan',
    'carrefour',
    'aldi',
    'monoprix',
    'casino',
    'leader price',
    'leclerc',
    'intermarché',
    'super u'
  ];

  segments.forEach(seg => {
    const match = seg.match(pattern);
    if (!match || !match.groups) return;
    const groups = match.groups as Record<string, string>;
    if (!groups.qty && !groups.unit) return;
    const rawQty = groups.qty ? groups.qty.toLowerCase() : '1';
    const quantity = wordNumbers[rawQty] || parseFloat(rawQty.replace(',', '.')) || 1;
    const unitNorm = normalizeUnit(groups.unit);
    let name = groups.name.trim();
    let marque: string | undefined;
    let gout: string | undefined;

    const flavorMatch = name.match(/go[uû]t\s+([^,]+)/i);
    if (flavorMatch) {
      gout = flavorMatch[1].trim();
      name = name.replace(flavorMatch[0], '').trim();
    }

    const brandMatch = name.match(/(?:marque|brand)\s+([^,]+)/i);
    if (brandMatch) {
      marque = brandMatch[1].trim();
      name = name.replace(brandMatch[0], '').trim();
    } else {
      for (const b of brandList) {
        const bReg = new RegExp(`\\b${b}\\b`, 'i');
        if (bReg.test(name)) {
          marque = capitalize(b);
          name = name.replace(bReg, '').trim();
          break;
        }
      }
    }

    const alias = nameAliases[name.toLowerCase()];
    if (alias) {
      name = alias;
    }

    foods.push({ nom: capitalize(name), quantite: quantity, unite: unitNorm, marque, gout });
  });

  return foods;
}

