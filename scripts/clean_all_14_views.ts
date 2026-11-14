import fs from 'node:fs';
import path from 'node:path';

const VIETNAMESE_REGEX = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/;

const files = [
  'Sidebar.tsx',
  'TopBar.tsx',
  'BranchesClassesView.tsx',
  'CareTasksView.tsx',
  'ActivityLogsView.tsx',
  'StudentListView.tsx',
  'StudentProfileModal.tsx',
  'FeedbackView.tsx',
  'RenewalView.tsx',
  'AssessmentsView.tsx',
  'InterventionsView.tsx',
  'SupplementaryView.tsx',
  'OverviewView.tsx',
  'StaffApprovalView.tsx',
];

for (const file of files) {
  const p = path.resolve('src/components/dashboard', file);
  let content = fs.readFileSync(p, 'utf-8');

  // Replace language === 'en' ? X : Y where X is single/double quoted or template string
  // Pattern 1: language === 'en' ? '...' : '...'
  content = content.replace(/language === 'en'\s*\?\s*('([^'\\]|\\.)*')\s*:\s*('([^'\\]|\\.)*')/g, '$1');
  // Pattern 2: language === 'en' ? "..." : "..."
  content = content.replace(/language === 'en'\s*\?\s*("([^"\\]|\\.)*")\s*:\s*("([^"\\]|\\.)*")/g, '$1');
  // Pattern 3: language === 'en' ? `...` : `...`
  content = content.replace(/language === 'en'\s*\?\s*(`([^`\\]|\\.)*`)\s*:\s*(`([^`\\]|\\.)*`)/g, '$1');

  // Pattern 4: in JSX: {language === 'en' ? '...' : '...'}
  content = content.replace(/\{\s*language === 'en'\s*\?\s*('([^'\\]|\\.)*')\s*:\s*('([^'\\]|\\.)*')\s*\}/g, '$1');

  fs.writeFileSync(p, content, 'utf-8');
}

console.log('Automated ternaries cleaned across 14 files!');
