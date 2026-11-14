import fs from 'node:fs';
import path from 'node:path';

const VIETNAMESE_REGEX = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/;

function walkDir(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath, fileList);
    } else if (/\.(tsx?|jsx?|json|sql)$/.test(file)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const srcFiles = walkDir('./src');
const results: { file: string; lineNum: number; line: string }[] = [];

for (const file of srcFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    // Ignore pure comments if needed, but let's see everything
    if (VIETNAMESE_REGEX.test(line)) {
      results.push({
        file: file.replace(/\\/g, '/'),
        lineNum: index + 1,
        line: line.trim(),
      });
    }
  });
}

console.log(`Found ${results.length} lines with Vietnamese characters across src/\n`);

// Group by file
const byFile = new Map<string, number>();
for (const r of results) {
  byFile.set(r.file, (byFile.get(r.file) || 0) + 1);
}

for (const [file, count] of byFile.entries()) {
  console.log(`${file}: ${count} occurrences`);
}

// Write detailed occurrences to a file for analysis
fs.writeFileSync(
  './vietnamese_occurrences.json',
  JSON.stringify(results, null, 2),
  'utf-8'
);
console.log('\nWrote details to vietnamese_occurrences.json');
