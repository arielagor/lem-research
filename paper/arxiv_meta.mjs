import { readFileSync, writeFileSync } from 'node:fs';
const t = readFileSync(new URL('./main.tex', import.meta.url), 'utf8');
const m = t.match(/\\begin\{abstract\}([\s\S]*?)\\end\{abstract\}/);
let a = m[1];
a = a
  .replace(/\\emph\{([^}]*)\}/g, '$1')
  .replace(/\\textbf\{([^}]*)\}/g, '$1')
  .replace(/\\%/g, '%').replace(/\\&/g, '&').replace(/\\_/g, '_')
  .replace(/\$\\delta\$/g, 'delta')
  .replace(/\$\\sim\$/g, '~').replace(/\{\\sim\}/g, '~')
  .replace(/\$([^$]*)\$/g, '$1')
  .replace(/---/g, '—')
  .replace(/\\citep\{[^}]*\}/g, '').replace(/\\cite\{[^}]*\}/g, '')
  .replace(/~/g, ' ')
  .replace(/\\[a-zA-Z]+\{?/g, '').replace(/[{}]/g, '')
  .replace(/[ \t]+/g, ' ').replace(/\n{2,}/g, '\n\n').trim();
writeFileSync(new URL('./arxiv-abstract.txt', import.meta.url), a);
console.log(a);
