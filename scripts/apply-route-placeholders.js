/**
 * 内部リンクを Handlebars の {{url.*}} / {{assetBase}} に一括置換
 * node scripts/apply-route-placeholders.js
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join } from 'path';
import { pageRoutes } from './routes.js';

import { fileURLToPath } from 'url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'src');

/** @type {Record<string, string>} */
const htmlToKey = Object.fromEntries(
  Object.entries(pageRoutes).map(([key, file]) => [file, key])
);

/** @param {string} dir */
function collectFiles(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith('sample_')) continue;
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      collectFiles(path, acc);
    } else if (/\.(html|js)$/.test(name)) {
      acc.push(path);
    }
  }
  return acc;
}

const replacements = [
  ...Object.entries(htmlToKey).map(([file, key]) => [
    new RegExp(`\\./${file.replace('.', '\\.')}(?=[\"'\\s?#])`, 'g'),
    `{{url.${key}}}`
  ]),
  [/\.\/index\.html(?=["'\s?#])/g, '{{url.home}}'],
  [/(href|src)="\.\/img\//g, '$1="{{assetBase}}img/'],
  [/(href|src)='\.\/img\//g, "$1='{{assetBase}}img/"],
  [/(data-story-(?:gallery|figures)=)([^"']+)/g, (_, attr, value) =>
    `${attr}${value.replace(/\.\/img\//g, '{{assetBase}}img/')}`],
  [/href="\.\/scss\/style\.scss"/g, 'href="{{assetBase}}scss/style.scss"'],
  [/src="\.\/js\//g, 'src="{{assetBase}}js/'],
  [/href="favicon\.svg"/g, 'href="{{assetBase}}favicon.svg"'],
  [/(?<![a-z])href="\/"(?=[^a-z])/g, 'href="{{url.home}}"']
];

for (const path of collectFiles(root)) {
  let content = readFileSync(path, 'utf8');
  let changed = false;

  for (const [pattern, replacement] of replacements) {
    const next = content.replace(pattern, replacement);
    if (next !== content) {
      content = next;
      changed = true;
    }
  }

  if (changed) {
    writeFileSync(path, content);
    console.log('updated', path.replace(root + '/', ''));
  }
}
