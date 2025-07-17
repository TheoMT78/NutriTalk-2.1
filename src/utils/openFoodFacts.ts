export interface OFFProduct {
  product_name: string;
  nutriments?: {
    'energy-kcal_100g'?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
    fiber_100g?: number;
    'vitamin-a_100g'?: number;
    'vitamin-c_100g'?: number;
    calcium_100g?: number;
    iron_100g?: number;
  };
  code: string;
  serving_size?: string;
}

import aliments from '../data/aliments.json';
import { safeJson } from './safeJson';

export function loadLocalFoodBase(): OFFProduct[] {
  return aliments as OFFProduct[];
}

export async function fetchProductByBarcode(barcode: string): Promise<OFFProduct | null> {
  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}?fields=product_name,nutriments,code,serving_size`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error('OpenFoodFacts barcode request failed', res.status, res.statusText);
      return null;
    }
    const data = await safeJson(res);
    if (!data || !data.product) return null;
    return data.product as OFFProduct;
  } catch (e) {
    console.error('fetchProductByBarcode error', e);
    return null;
  }
}

export async function searchProduct(query: string): Promise<OFFProduct[]> {
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&fields=product_name,nutriments,code,serving_size`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error('OpenFoodFacts search request failed', res.status, res.statusText);
      return [];
    }
    const data = await safeJson(res);
    return (data?.products as OFFProduct[]) || [];
  } catch (e) {
    console.error('searchProduct error', e);
    return [];
  }
}

export async function searchProductFallback(query: string): Promise<OFFProduct[]> {
  try {
    let cleaned = query.trim();
    const brandMatch = cleaned.match(/(?:marque|brand)\s+([^,]+)/i);
    if (brandMatch) {
      const brand = brandMatch[1].trim();
      cleaned = cleaned.replace(brandMatch[0], '').trim();
      let byBrand = await searchProduct(`${cleaned} ${brand}`);
      if (byBrand.length > 0) return byBrand;
      byBrand = await searchProduct(brand);
      if (byBrand.length > 0) {
        const lowered = cleaned.toLowerCase();
        const filtered = byBrand.filter(p => p.product_name?.toLowerCase().includes(lowered));
        if (filtered.length > 0) return filtered;
      }
    }

    let results = await searchProduct(cleaned);
    if (results.length > 0) return results;

    const terms = cleaned.split(/\s+/).filter(Boolean);
    const synonyms: Record<string, string[]> = {
      farine: ['flour'],
      flour: ['farine'],
      beurre: ['butter'],
      butter: ['beurre'],
      riz: ['rice'],
      rice: ['riz'],
      'beurre cut': ['beurre de cacahuete', 'peanut butter'],
      'keke wet': ['beurre de cacahuete'],
      prozis: [],
      bulk: []
    };

    for (const term of terms) {
      results = await searchProduct(term);
      if (results.length > 0) return results;
      const extra = synonyms[term.toLowerCase()] || [];
      for (const alt of extra) {
        results = await searchProduct(alt);
        if (results.length > 0) return results;
      }
    }
    return [];
  } catch (e) {
    console.error('searchProductFallback error', e);
    return [];
  }
}
