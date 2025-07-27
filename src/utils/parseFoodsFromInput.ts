export interface NaiveParsedFood {
  raw: string;
  quantity: number;
  name: string;
}

import { normalizeFoodName } from './normalizeFoodName';

export function parseFoodsFromInput(text: string): NaiveParsedFood[] {
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

  const regex = /(?<qty>\d+(?:[.,]\d+)?|un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix)(?:\s?(?<unit>kg|g|gr|grammes?|ml|cl|l|càs|cas|càc|cac|tranches?|tranche|pi[eè]ce?s?|sachets?|pots?))?\s+(?:de\s+|d['’])?(?<name>[a-zA-ZéèêàçûîôùœŒ'-]+)/gi;

  const matches = [...text.matchAll(regex)];
  if (matches.length === 0) return [];

  return matches.map(m => {
    const qtyRaw = m.groups?.qty || m[1];
    const qty =
      wordNumbers[qtyRaw.toLowerCase()] ?? parseFloat(qtyRaw.replace(',', '.'));
    return {
      raw: m[0].trim(),
      quantity: qty || 1,
      name: normalizeFoodName(m.groups?.name || m[3])
    } as NaiveParsedFood;
  });
}
