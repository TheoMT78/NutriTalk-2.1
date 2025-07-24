export interface NaiveParsedFood {
  raw: string;
  quantity: number;
  name: string;
}

import { normalizeFoodName } from './normalizeFoodName';

export function parseFoodsFromInput(text: string): NaiveParsedFood[] {
  const regex = /(\d+(?:[.,]\d+)?)(?:\s?(?:g|gr|grammes?))?\s+(?:de\s+|d['’])?([a-zA-ZéèêàçûîôùœŒ'-]+)/gi;
  const matches = [...text.matchAll(regex)];
  if (matches.length === 0) return [];
  return matches.map(m => ({
    raw: m[0],
    quantity: parseFloat(m[1].replace(',', '.')),
    name: normalizeFoodName(m[2])
  }));
}
