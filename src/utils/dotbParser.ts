/**
 * DotB Student List Parser & Deduplication Engine
 * Parses DotB CRM student list exports (.xls HTML format, CSV, TSV, or copy-pasted text)
 * Designed to meet KAPLA Center Manager (CM Phương Nhi) requirements:
 * - Prioritizes Student Full Name, Class Name, Birthdate, and Nick-name
 * - Built-in anti-duplicate engine: detects existing students in the system and within the file
 * - Converts birthdates (DD/MM/YYYY -> YYYY-MM-DD ISO)
 * - Auto-generates unique sequential student codes (KAP-PH-xxx) without wasting codes on duplicates
 * - 100% English terminology and notifications
 */

import { Student } from '../types';

export interface ParsedDotbStudent {
  id: string;
  student_code: string;
  full_name: string;
  nickname?: string;
  date_of_birth?: string;
  gender: 'male' | 'female';
  class_name: string;
  status: string;
  source?: string;
  is_duplicate?: boolean;
  duplicate_reason?: string;
  matched_student_code?: string;
}

export interface ParsedDotbClassSummary {
  name: string;
  studentCount: number;
  newStudentCount: number;
  inferredLevel: string;
}

export interface DotbParseResult {
  students: ParsedDotbStudent[];
  classes: ParsedDotbClassSummary[];
  totalWithNicknames: number;
  totalWithBirthdate: number;
  totalDuplicates: number;
  totalNew: number;
}

/**
 * Normalizes student name for comparison (lowercased, accents/diacritics stripped, spaces normalized)
 */
export function normalizeStudentName(name: string): string {
  if (!name) return '';
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Checks if two student records represent the same individual
 */
export function isSameStudent(
  cand: { full_name: string; date_of_birth?: string; nickname?: string; student_code?: string },
  existing: { full_name: string; date_of_birth?: string; nickname?: string; student_code?: string }
): boolean {
  // 1. Same student code
  if (cand.student_code && existing.student_code) {
    if (cand.student_code.trim().toUpperCase() === existing.student_code.trim().toUpperCase()) {
      return true;
    }
  }

  // 2. Name comparison (both exact with diacritics, and accent-insensitive)
  const candNameExact = (cand.full_name || '').trim().toLowerCase();
  const existNameExact = (existing.full_name || '').trim().toLowerCase();
  const candNameNorm = normalizeStudentName(cand.full_name);
  const existNameNorm = normalizeStudentName(existing.full_name);

  if (candNameExact === existNameExact || candNameNorm === existNameNorm) {
    // 2a. If both have nicknames and they match, it is the same student (e.g., Tran Thai Binh "Leo")
    if (cand.nickname && existing.nickname) {
      if (cand.nickname.trim().toLowerCase() === existing.nickname.trim().toLowerCase()) {
        return true;
      }
    }

    // 2b. If both have DOB, compare DOB
    if (cand.date_of_birth && existing.date_of_birth) {
      const cDob = cand.date_of_birth.trim();
      const eDob = existing.date_of_birth.trim();
      if (cDob === eDob) return true;
      // If birthdates are explicitly different and nicknames were not matched
      return false;
    }

    // 2c. Default to true if names are identical
    return true;
  }

  return false;
}

/**
 * Finds an existing student in the directory matching the candidate
 */
export function findDuplicateStudent(
  candidate: { full_name: string; date_of_birth?: string; nickname?: string; student_code?: string },
  existingStudents: Student[]
): Student | undefined {
  if (!candidate.full_name?.trim()) return undefined;
  return existingStudents.find((s) => isSameStudent(candidate, s));
}

/**
 * Normalizes date from DD/MM/YYYY or DD-MM-YYYY to YYYY-MM-DD
 */
export function normalizeDateToIso(rawDate: string): string | undefined {
  if (!rawDate) return undefined;
  const cleaned = rawDate.replace(/&nbsp;/g, '').trim();
  if (!cleaned) return undefined;

  // DD/MM/YYYY or DD-MM-YYYY
  const parts = cleaned.split(/[\/\-\.]/);
  if (parts.length === 3) {
    const p1 = parseInt(parts[0], 10);
    const p2 = parseInt(parts[1], 10);
    const p3 = parseInt(parts[2], 10);

    // If format is YYYY-MM-DD
    if (p1 > 1900 && p2 >= 1 && p2 <= 12 && p3 >= 1 && p3 <= 31) {
      return `${p1}-${String(p2).padStart(2, '0')}-${String(p3).padStart(2, '0')}`;
    }

    // If format is DD/MM/YYYY
    if (p3 > 1900 && p2 >= 1 && p2 <= 12 && p1 >= 1 && p1 <= 31) {
      return `${p3}-${String(p2).padStart(2, '0')}-${String(p1).padStart(2, '0')}`;
    }

    // 2-digit year DD/MM/YY
    if (p3 < 100 && p2 >= 1 && p2 <= 12 && p1 >= 1 && p1 <= 31) {
      const year = p3 > 50 ? 1900 + p3 : 2000 + p3;
      return `${year}-${String(p2).padStart(2, '0')}-${String(p1).padStart(2, '0')}`;
    }
  }

  return undefined;
}

/**
 * Infers course/class level from DotB class name
 */
export function inferClassLevel(className: string): string {
  const c = className.toUpperCase();
  if (c.includes('L10') || c.includes('L11') || c.includes('L12')) return 'Level 10-12';
  if (c.includes('L8') || c.includes('L9')) return 'Level 8-9';
  if (c.includes('L6') || c.includes('L7')) return 'Level 6-7';
  if (c.includes('L4') || c.includes('L5')) return 'Level 4-5';
  if (c.includes('L2') || c.includes('L3')) return 'Level 2-3';
  if (c.includes('L1')) return 'Level 1';
  if (c.includes('CRE')) return 'Creative Thinking';
  if (c.includes('RBT') || c.includes('ROBOT')) return 'Robotics';
  if (c.includes('CHESS')) return 'Pre-Chess';
  if (c.includes('THINKER')) return 'Little Thinkers';
  if (c.includes('3T-5T') || c.includes('3-5') || c.includes('3-4') || c.includes('4-5')) return 'Early Explorers';
  if (c.includes('6-8') || c.includes('5-7') || c.includes('7-9')) return 'Primary Innovators';
  return 'Standard Cohort';
}

/**
 * Generates an array of sequential student codes
 */
export function generateStudentCodes(
  branchCode: string,
  existingCodes: string[],
  count: number
): string[] {
  let highestNum = 0;
  const prefix = `KAP-${branchCode}-`;
  const pattern = new RegExp(`^KAP-${branchCode}-(\\d+)$`, 'i');

  for (const c of existingCodes) {
    const m = c.match(pattern);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > highestNum) highestNum = n;
    }
  }

  const generated: string[] = [];
  for (let i = 1; i <= count; i++) {
    const code = `${prefix}${String(highestNum + i).padStart(3, '0')}`;
    generated.push(code);
  }
  return generated;
}

/**
 * Main parser & deduplication engine: handles DotB HTML/XLS, TSV, or CSV text
 * Prevents importing duplicate records that already exist in the database or earlier in the file.
 */
export function parseDotbExport(
  rawContent: string,
  branchCode = 'PH',
  existingStudentsOrCodes: Student[] | string[] = []
): DotbParseResult {
  const content = rawContent.trim();
  if (!content) {
    return {
      students: [],
      classes: [],
      totalWithNicknames: 0,
      totalWithBirthdate: 0,
      totalDuplicates: 0,
      totalNew: 0,
    };
  }

  // Normalize existingStudents array
  const existingStudents: Student[] = existingStudentsOrCodes.map((item) =>
    typeof item === 'string'
      ? ({
          id: item,
          student_code: item,
          full_name: '',
          branch_id: '',
          gender: 'male' as const,
          parent_name: '',
          parent_phone: '',
          tuition_expiry_date: '',
          status: 'active' as const,
        } as Student)
      : item
  );

  const existingCodes = existingStudents
    .map((s) => s.student_code)
    .filter(Boolean);

  const isHtml = /<tr[^>]*>|<table|class=["']report/i.test(content);

  const rawList: Array<{
    className: string;
    fullName: string;
    nickname?: string;
    birthdate?: string;
    status: string;
    source?: string;
  }> = [];

  if (isHtml) {
    // 1. DotB HTML Table Parser (.xls from DotB)
    const trMatches = content.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
    let currentClass = 'General Cohort';

    for (const tr of trMatches) {
      // Check if class header row
      const classHeader = tr.match(/Class Name = ([^,<]+)/i);
      if (classHeader && classHeader[1]) {
        currentClass = classHeader[1].replace(/&nbsp;/g, ' ').trim();
        continue;
      }

      const tdMatches = tr.match(/<td[^>]*>[\s\S]*?<\/td>/gi);
      if (!tdMatches || tdMatches.length < 3) continue;

      const cells = tdMatches.map((td) =>
        td
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&gt;/g, '>')
          .replace(/&lt;/g, '<')
          .trim()
      );

      // Typical DotB structure:
      // cells[0]: No. (e.g., '1')
      // cells[1]: Class Name
      // cells[2]: Student Full Name
      // cells[3]: Student Type (e.g., 'Student')
      // cells[4]: Status (e.g., 'In Progress', 'Delayed', 'Finished')
      // cells[5]: Birthdate (e.g., '18/05/2016')
      // cells[6]: Nick-name (e.g., 'Doris')
      // cells[7]: Source (e.g., 'Local MKT')

      if (/^\d+$/.test(cells[0]) && cells[2]) {
        const studentName = cells[2].trim();
        if (studentName && !studentName.toLowerCase().startsWith('student name')) {
          const rowClass = cells[1] || currentClass;
          const status = cells[4] || 'In Progress';
          const dob = normalizeDateToIso(cells[5]);
          const nickname = cells[6] && cells[6] !== '-none-' ? cells[6] : undefined;
          const source = cells[7] && cells[7] !== '-none-' ? cells[7] : undefined;

          rawList.push({
            className: rowClass,
            fullName: studentName,
            nickname,
            birthdate: dob,
            status,
            source,
          });
        }
      }
    }
  } else {
    // 2. TSV / CSV / Text Line Parser (e.g., copied directly from Excel / Google Sheets)
    const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    let currentClass = 'Imported Cohort';

    for (const line of lines) {
      if (/^#|^class[:=]/i.test(line)) {
        currentClass = line.replace(/^[#Class:=\s]+/i, '').trim();
        continue;
      }

      const isTsv = line.includes('\t');
      const parts = isTsv ? line.split('\t').map((p) => p.trim()) : line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((p) => p.trim());

      // If header line, skip
      const firstLower = parts[0]?.toLowerCase() || '';
      if (firstLower === 'no.' || firstLower === 'stt' || firstLower.includes('student name') || firstLower.includes('tên')) {
        continue;
      }

      let name = '';
      let nick = '';
      let dob: string | undefined = undefined;
      let rowClass = currentClass;
      let status = 'In Progress';

      if (parts.length >= 7 && /^\d+$/.test(parts[0])) {
        // Full DotB row pasted: No, Class, Name, Type, Status, DOB, Nick, Source
        rowClass = parts[1] || currentClass;
        name = parts[2];
        status = parts[4] || 'In Progress';
        dob = normalizeDateToIso(parts[5]);
        nick = parts[6] || '';
      } else if (parts.length >= 2) {
        // [Name, Nickname, DOB?] or [Code, Name, Nickname]
        if (/^(KAP-|HV-|[0-9]{3,})/i.test(parts[0])) {
          name = parts[1];
          nick = parts[2] || '';
          if (parts[3]) dob = normalizeDateToIso(parts[3]);
        } else {
          name = parts[0];
          nick = parts[1];
          if (parts[2]) dob = normalizeDateToIso(parts[2]);
        }
      } else if (parts.length === 1) {
        // Single column: Name (Nickname)
        const parenMatch = parts[0].match(/^(.*?)\s*[\(\[\{](.*?)[\)\]\}]\s*$/);
        if (parenMatch) {
          name = parenMatch[1].trim();
          nick = parenMatch[2].trim();
        } else {
          name = parts[0];
        }
      }

      name = name.replace(/^["']|["']$/g, '').trim();
      nick = nick.replace(/^["']|["']$/g, '').trim();

      if (name) {
        rawList.push({
          className: rowClass,
          fullName: name,
          nickname: nick || undefined,
          birthdate: dob,
          status,
        });
      }
    }
  }

  // Pre-generate unique student codes for candidate students
  const autoCodes = generateStudentCodes(branchCode, existingCodes, rawList.length);

  // Group classes and count students
  const classCountMap = new Map<string, { total: number; newCount: number }>();
  for (const s of rawList) {
    if (!classCountMap.has(s.className)) {
      classCountMap.set(s.className, { total: 0, newCount: 0 });
    }
    const current = classCountMap.get(s.className)!;
    current.total += 1;
  }

  // Deduplication tracker: tracks seen students in this batch
  const seenBatchMap = new Map<
    string,
    { className: string; student_code: string; dob?: string; nickname?: string }
  >();

  let totalWithNicknames = 0;
  let totalWithBirthdate = 0;
  let totalDuplicates = 0;
  let totalNew = 0;
  let codeIndex = 0;

  const students: ParsedDotbStudent[] = rawList.map((item, index) => {
    if (item.nickname) totalWithNicknames++;
    if (item.birthdate) totalWithBirthdate++;

    const normName = normalizeStudentName(item.fullName);
    let isDuplicate = false;
    let duplicateReason: string | undefined = undefined;
    let matchedStudentCode: string | undefined = undefined;

    // Check 1: Does this student already exist in the system database?
    const existingDbMatch = findDuplicateStudent(
      {
        full_name: item.fullName,
        date_of_birth: item.birthdate,
        nickname: item.nickname,
      },
      existingStudents
    );

    if (existingDbMatch) {
      isDuplicate = true;
      matchedStudentCode = existingDbMatch.student_code;
      duplicateReason = `Already enrolled in system (${existingDbMatch.student_code}${
        existingDbMatch.current_class?.name ? ` - ${existingDbMatch.current_class.name}` : ''
      })`;
    } else {
      // Check 2: Does this student appear earlier in this file batch?
      const batchSeen = seenBatchMap.get(normName);
      if (batchSeen) {
        // If both have DOB and differ, they might be different students
        if (item.birthdate && batchSeen.dob && item.birthdate !== batchSeen.dob) {
          isDuplicate = false;
        } else {
          isDuplicate = true;
          matchedStudentCode = batchSeen.student_code;
          duplicateReason = `Duplicate in file (already listed under cohort ${batchSeen.className})`;
        }
      }
    }

    let assignedCode = matchedStudentCode;
    if (isDuplicate) {
      totalDuplicates++;
    } else {
      totalNew++;
      assignedCode = autoCodes[codeIndex] || `KAP-${branchCode}-${String(index + 1).padStart(3, '0')}`;
      codeIndex++;
      seenBatchMap.set(normName, {
        className: item.className,
        student_code: assignedCode,
        dob: item.birthdate,
        nickname: item.nickname,
      });

      // Update new count for class
      const clsEntry = classCountMap.get(item.className);
      if (clsEntry) clsEntry.newCount += 1;
    }

    return {
      id: `dotb-${Date.now()}-${index}`,
      student_code: assignedCode || `KAP-${branchCode}-${String(index + 1).padStart(3, '0')}`,
      full_name: item.fullName,
      nickname: item.nickname,
      date_of_birth: item.birthdate,
      gender: 'male',
      class_name: item.className,
      status: item.status,
      source: item.source,
      is_duplicate: isDuplicate,
      duplicate_reason: duplicateReason,
      matched_student_code: matchedStudentCode,
    };
  });

  const classSummaries: ParsedDotbClassSummary[] = Array.from(classCountMap.entries()).map(
    ([name, counts]) => ({
      name,
      studentCount: counts.total,
      newStudentCount: counts.newCount,
      inferredLevel: inferClassLevel(name),
    })
  );

  return {
    students,
    classes: classSummaries,
    totalWithNicknames,
    totalWithBirthdate,
    totalDuplicates,
    totalNew,
  };
}
