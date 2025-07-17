import { searchProductFallback } from './openFoodFacts';
import { safeJson } from './safeJson';

function extractNutrition(text: string) {
  const cals = text.match(/(\d+(?:[.,]\d+)?)\s*(?:kcal|calories?)/i);
  const prot = text.match(/(\d+(?:[.,]\d+)?)\s*(?:g|grammes?)\s*(?:de\s*)?(?:proteines?|protein|prot)/i);
  const carb = text.match(/(\d+(?:[.,]\d+)?)\s*(?:g|grammes?)\s*(?:de\s*)?(?:glucides?|carbs?)/i);
  const fat = text.match(/(\d+(?:[.,]\d+)?)\s*(?:g|grammes?)\s*(?:de\s*)?(?:lipides?|fat|gras)/i);
  return {
    calories: cals ? parseFloat(cals[1].replace(',', '.')) : undefined,
    protein: prot ? parseFloat(prot[1].replace(',', '.')) : undefined,
    carbs: carb ? parseFloat(carb[1].replace(',', '.')) : undefined,
    fat: fat ? parseFloat(fat[1].replace(',', '.')) : undefined,
  };
}

// Google Programmable Search is configured with these sites, queried first
const preferredSites = ['myprotein.com', 'prozis.com', 'bulk.com'];

async function searchPreferredSites(query: string): Promise<NutritionInfo | null> {
  const gKey = process.env.GOOGLE_API_KEY;
  const cseId = process.env.GOOGLE_CSE_ID;
  if (!gKey || !cseId) return null;
  for (const site of preferredSites) {
    try {
      const q = `site:${site} ${query} valeurs nutritionnelles`;
      const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(q)}&key=${gKey}&cx=${cseId}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await safeJson<{ items?: { snippet?: string; title?: string }[] }>(res);
        for (const item of data?.items || []) {
          const text: string = item.snippet || '';
          const title: string = item.title || query;
          const nut = extractNutrition(text);
          if (nut.calories || nut.protein || nut.carbs || nut.fat) {
            return { name: title, ...nut, unit: '100g' };
          }
        }
      } else {
        console.error('Preferred site search failed', res.status, res.statusText);
      }
    } catch (e) {
      console.error('Preferred site search error', e);
    }
  }
  return null;
}

export interface NutritionInfo {
  name: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  unit?: string;
}

export async function searchNutrition(query: string): Promise<NutritionInfo | null> {
  const off = await searchProductFallback(query);
  if (off[0]) {
    const p = off[0];
    return {
      name: p.product_name || query,
      calories: p.nutriments?.['energy-kcal_100g'],
      protein: p.nutriments?.proteins_100g,
      carbs: p.nutriments?.carbohydrates_100g,
      fat: p.nutriments?.fat_100g,
      unit: p.serving_size?.includes('ml') ? '100ml' : '100g'
    };
  }

  if (/(myprotein|prozis|bulk)/i.test(query)) {
    const brandResult = await searchPreferredSites(query);
    if (brandResult) return brandResult;
  }

  const appId = process.env.EDAMAM_APP_ID;
  const appKey = process.env.EDAMAM_APP_KEY;
  if (appId && appKey) {
    try {
      const url = `https://api.edamam.com/api/food-database/v2/parser?ingr=${encodeURIComponent(query)}&app_id=${appId}&app_key=${appKey}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await safeJson(res);
        const food = data.parsed?.[0]?.food || data.hints?.[0]?.food;
        if (food) {
          return {
            name: food.label,
            calories: food.nutrients?.ENERC_KCAL,
            protein: food.nutrients?.PROCNT,
            carbs: food.nutrients?.CHOCDF,
            fat: food.nutrients?.FAT,
            unit: '100g'
          };
        }
      } else {
        console.error('Edamam API error', res.status, res.statusText);
      }
    } catch (e) {
      console.error('Edamam API error', e);
    }
  }

  const spoonKey = process.env.SPOONACULAR_KEY;
  if (spoonKey) {
    try {
      const searchUrl = `https://api.spoonacular.com/food/ingredients/search?query=${encodeURIComponent(query)}&apiKey=${spoonKey}&number=1`;
      const sRes = await fetch(searchUrl);
      if (sRes.ok) {
        const sData = await safeJson(sRes);
        const item = sData.results?.[0];
        if (item && item.id) {
          const infoUrl = `https://api.spoonacular.com/food/ingredients/${item.id}/information?amount=100&unit=gram&apiKey=${spoonKey}`;
          const iRes = await fetch(infoUrl);
          if (iRes.ok) {
            const info = await safeJson(iRes);
            const get = (n: string) => {
              return info.nutrition?.nutrients?.find((x: {name: string; amount: number}) => x.name.toLowerCase() === n)?.amount;
            };
            return {
              name: info.name,
              calories: get('calories'),
              protein: get('protein'),
              carbs: get('carbohydrates'),
              fat: get('fat'),
              unit: '100g'
            };
          } else {
            console.error('Spoonacular info request failed', iRes.status, iRes.statusText);
          }
        }
      } else {
        console.error('Spoonacular search request failed', sRes.status, sRes.statusText);
      }
    } catch (e) {
      console.error('Spoonacular API error', e);
    }
  }

  const gKey = process.env.GOOGLE_API_KEY;
  const cseId = process.env.GOOGLE_CSE_ID;
  if (gKey && cseId) {
    try {
      const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query + ' calories')}&key=${gKey}&cx=${cseId}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await safeJson<{ items?: { snippet?: string; title?: string }[] }>(res);
        for (const item of data?.items || []) {
          const text: string = item.snippet || '';
          const title: string = item.title || query;
          const nut = extractNutrition(text);
          if (nut.calories || nut.protein || nut.carbs || nut.fat) {
            return {
              name: title,
              ...nut,
              unit: '100g'
            };
          }
        }
      }
    } catch (e) {
      console.error('Google Custom Search error', e);
    }
  }

  return null;
}

