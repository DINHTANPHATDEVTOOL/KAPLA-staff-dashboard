import fs from 'node:fs';
import path from 'node:path';

const filePath = path.resolve('src/context/LanguageContext.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Find start of en: {
const enIndex = content.indexOf('  en: {');
if (enIndex !== -1) {
  // Extract en dictionary
  const header = `// ==============================================================================
// KAPLA Staff Dashboard — Language Context & Localization (100% English Portal)
// ==============================================================================

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { translateDbText } from '../utils/dataTranslator';

export { translateDbText };
export type Language = 'vi' | 'en';

const STORAGE_KEY = 'kapla_language';

const EN_TRANSLATIONS: Record<string, string> = {`;

  // from after '  en: {' to the end of translations
  const enBody = content.substring(enIndex + '  en: {'.length);
  const closingIndex = enBody.indexOf('  },\n};');
  const closingIndexCRLF = enBody.indexOf('  },\r\n};');
  const closeIdx = closingIndex !== -1 ? closingIndex : closingIndexCRLF;

  const enDict = enBody.substring(0, closeIdx);
  const remainder = enBody.substring(closeIdx + (closingIndex !== -1 ? '  },\n};'.length : '  },\r\n};'.length));

  const newContent = `${header}${enDict}
};

const TRANSLATIONS: Record<Language, Record<string, string>> = {
  vi: EN_TRANSLATIONS,
  en: EN_TRANSLATIONS,
};
${remainder}`;

  fs.writeFileSync(filePath, newContent, 'utf-8');
  console.log('Successfully updated LanguageContext.tsx to pure EN_TRANSLATIONS!');
} else {
  console.error('Could not find en: { in LanguageContext.tsx');
}
