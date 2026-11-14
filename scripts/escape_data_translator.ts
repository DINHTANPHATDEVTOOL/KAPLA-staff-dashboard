import fs from 'node:fs';
import path from 'node:path';

const filePath = path.resolve('src/utils/dataTranslator.ts');
const content = fs.readFileSync(filePath, 'utf-8');

// Replace any non-ASCII character (code > 127) with its \uXXXX escape sequence
const escaped = content.replace(/[^\x00-\x7F]/g, (ch) => {
  return '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0');
});

fs.writeFileSync(filePath, escaped, 'utf-8');
console.log('Escaped dataTranslator.ts to unicode sequences!');
