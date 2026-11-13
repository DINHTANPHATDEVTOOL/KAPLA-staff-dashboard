import fs from 'node:fs';
import path from 'node:path';

const langFile = fs.readFileSync('src/context/LanguageContext.tsx', 'utf-8');

// Extract vi and en translation objects
const viMatch = langFile.match(/vi:\s*\{([\s\S]*?)\n\s*\},/);
const enMatch = langFile.match(/en:\s*\{([\s\S]*?)\n\s*\},/);

if (!viMatch || !enMatch) {
  console.error('Could not match vi or en objects');
  process.exit(1);
}

function getKeys(block: string) {
  const keys = new Set<string>();
  const lines = block.split('\n');
  for (const line of lines) {
    const m = line.match(/^\s*['"]([a-zA-Z0-9_.]+)['"]\s*:/);
    if (m) {
      keys.add(m[1]);
    }
  }
  return keys;
}

const viKeys = getKeys(viMatch[1]);
const enKeys = getKeys(enMatch[1]);

console.log('Total VI keys in dict:', viKeys.size, 'Total EN keys in dict:', enKeys.size);

function scanDir(dir: string): string[] {
  let files: string[] = [];
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) files.push(...scanDir(full));
    else if (full.endsWith('.ts') || full.endsWith('.tsx')) files.push(full);
  }
  return files;
}

const allFiles = scanDir('src');
const missingEn: Array<{ file: string; key: string }> = [];
const missingVi: Array<{ file: string; key: string }> = [];

for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  const tRegex = /\bt\(\s*['"]([a-zA-Z0-9_.]+)['"]/g;
  let match;
  while ((match = tRegex.exec(content)) !== null) {
    const key = match[1];
    if (!enKeys.has(key)) missingEn.push({ file, key });
    if (!viKeys.has(key)) missingVi.push({ file, key });
  }
}

console.log('--- MISSING IN EN (' + missingEn.length + ') ---');
console.log(JSON.stringify(missingEn, null, 2));

console.log('--- MISSING IN VI (' + missingVi.length + ') ---');
console.log(JSON.stringify(missingVi, null, 2));
