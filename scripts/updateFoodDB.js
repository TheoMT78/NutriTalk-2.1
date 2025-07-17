#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const limit = parseInt(process.argv[2] || '5000', 10);
const pageSize = 1000;
let page = 1;
const products = [];

while (products.length < limit) {
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_simple=1&action=process&json=1&fields=product_name,nutriments,code,serving_size&page_size=${pageSize}&page=${page}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error('Request failed', res.status, res.statusText);
    break;
  }
  const text = await res.text();
  if (!text) {
    console.error('Empty response from', url);
    break;
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    console.error('Invalid JSON from', url, e);
    break;
  }
  const items = data.products || [];
  if (items.length === 0) break;
  for (const item of items) {
    if (item.product_name) {
      products.push(item);
      if (products.length >= limit) break;
    }
  }
  page++;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dest = path.join(__dirname, '..', 'src', 'data', 'aliments.json');
await fs.promises.writeFile(dest, JSON.stringify(products, null, 2));
console.log(`Saved ${products.length} items to ${dest}`);
