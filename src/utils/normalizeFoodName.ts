import removeAccents from 'remove-accents';
import { synonyms } from './synonyms';

export function normalizeFoodName(name: string): string {
  let n = removeAccents(name.toLowerCase().trim());
  n = n.replace(/\bde\s+/g, '');
  n = n.replace(/s$/, '');
  if (synonyms[n]) n = synonyms[n];
  return n;
}
