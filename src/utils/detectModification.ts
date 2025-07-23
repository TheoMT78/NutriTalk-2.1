export interface ModificationIntent {
  name: string;
  meal: 'petit-déjeuner' | 'déjeuner' | 'dîner' | 'collation';
  newQuantity: number;
  unit: string;
  oldQuantity?: number;
}

import { parseFoods } from './parseFoods';

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
  dix: 10,
};

function parseQty(token: string): number {
  return wordNumbers[token.toLowerCase()] ?? parseFloat(token.replace(',', '.'));
}

const mealMap: Record<ModificationIntent['meal'], RegExp> = {
  'petit-déjeuner': /(petit[- ]deje?uner|matin)/i,
  'déjeuner': /(deje?uner|midi)/i,
  'dîner': /(diner|dîner|soir)/i,
  'collation': /(collation|go\u00fbter)/i,
};

const intentPatterns: RegExp[] = [
  /au final/i,
  /finalement/i,
  /j[ae] (?:change|changé|changée|modifi|modifié)/i,
  /ce n[’']?était pas/i,
  /au lieu de/i,
  /modifie/i,
  /remplac/i,
];

export async function detectModificationIntent(
  message: string
): Promise<ModificationIntent | null> {
  const cleanedMsg = message.replace(/qu['’](un|une)/gi, '$1');
  const lower = cleanedMsg.toLowerCase();
  if (!intentPatterns.some(p => p.test(lower))) return null;

  let meal: ModificationIntent['meal'] = 'déjeuner';
  for (const [m, regex] of Object.entries(mealMap)) {
    if (regex.test(lower)) {
      meal = m as ModificationIntent['meal'];
      break;
    }
  }

  const foods = await parseFoods(cleanedMsg);
  if (!foods.length) return null;
  const { name: rawName, quantity, unit } = foods[0];
  const name = rawName
    .replace(/\s+(?:j[’']?en.*)/i, '')
    .replace(/\s+par\b.*$/i, '')
    .replace(/\s+qu['’]un.*$/i, '')
    .replace(/\s+qu['’]une.*$/i, '')
    .replace(/\s+ce\s+(matin|midi|soir).*$/i, '')
    .trim();

  let newQuantity = quantity;
  let oldQuantity: number | undefined;

  const numPattern = /(\d+(?:[.,]\d+)?|un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix)/gi;
  const nums = Array.from(message.matchAll(numPattern)).map(m => parseQty(m[1]));

  const auLieu1 = message.match(/(\d+(?:[.,]\d+)?|un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix)[^\d]*(?:au lieu de|pas|n.?était pas)[^\d]*(\d+(?:[.,]\d+)?|un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix)/i);
  const auLieu2 = message.match(/au lieu de[^\d]*(\d+(?:[.,]\d+)?|un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix)[^\d]*(\d+(?:[.,]\d+)?|un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix)/i);
  const replace = message.match(/remplac\w*[^\d]*(\d+(?:[.,]\d+)?|un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix)[^\d]*par[^\d]*(\d+(?:[.,]\d+)?|un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix)/i);

  if (auLieu1) {
    newQuantity = parseQty(auLieu1[1]);
    oldQuantity = parseQty(auLieu1[2]);
  } else if (auLieu2) {
    oldQuantity = parseQty(auLieu2[1]);
    newQuantity = parseQty(auLieu2[2]);
  } else if (replace) {
    oldQuantity = parseQty(replace[1]);
    newQuantity = parseQty(replace[2]);
  } else if (nums.length > 0) {
    newQuantity = nums[nums.length - 1];
    if (nums.length > 1) oldQuantity = nums[0];
  }

  return {
    name,
    meal,
    newQuantity,
    unit,
    oldQuantity,
  };
}
