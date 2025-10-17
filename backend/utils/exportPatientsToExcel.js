import * as XLSX from 'xlsx';
import { EXCEL_COLUMN_ORDER, QUESTION_ID_TO_COLUMN_MAP } from './columnOrder.js';

/**
 * Converts array values to Excel-friendly format
 */
const processValueForExcel = (value) => {
  if (Array.isArray(value)) return value.join(', ');
  return value ?? '';
};

/**
 * Handles special cases like medications, BP split, and shift pattern.
 */
// ...existing code...
/**
 * Handles special cases like medications, BP split, and shift pattern.
 */
const handleSpecialCases = (columnName, row) => {
  // Normalize medications to an array even if flattened to a string
  const meds = Array.isArray(row.medications)
    ? row.medications.map((m) => String(m).trim())
    : typeof row.medications === 'string'
    ? row.medications.split(/\s*,\s*/).filter(Boolean).map((m) => m.trim())
    : [];

  const norm = (s) => String(s).toLowerCase().replace(/[\s_-]+/g, '');

  const hasMed = (label) => meds.some((m) => norm(m) === norm(label));

  if (columnName === 'Sedative_hypnotics')
    return hasMed('Sedative-hypnotics') ? 'Yes' : 'No';

  if (columnName === 'Antidepressants')
    return hasMed('Antidepressants') ? 'Yes' : 'No';

  if (columnName === 'Antipsychotics')
    return hasMed('Antipsychotics') ? 'Yes' : 'No';

  if (columnName === 'Stimulants')
    return hasMed('Stimulants') ? 'Yes' : 'No';

  if (columnName === 'Opioids')
    return hasMed('Opioids') ? 'Yes' : 'No';

  // if (columnName === 'Others') {
  //   // Prefer the free text from entries like "Other: <text>" or "Others: <text>"
  //   const otherTexts = meds
  //     .map((m) => {
  //       const match = m.match(/^others?\s*:\s*(.*)$/i);
  //       return match ? match[1].trim() : null;
  //     })
  //     .filter((v) => v && v.length > 0);

  //   if (otherTexts.length > 0) {
  //     return otherTexts.join('; ');
  //   }

  //   // If no "Other:" text, list any non-standard medication labels
  //   const standard = new Set([
  //     'sedativehypnotics',
  //     'antidepressants',
  //     'antipsychotics',
  //     'stimulants',
  //     'opioids',
  //     'others',
  //     'other',
  //   ]);

  //   const nonStandard = meds.filter(
  //     (m) => !standard.has(norm(m)) && !/^others?\s*:/i.test(m)
  //   );

  //   return nonStandard.length > 0 ? nonStandard.join('; ') : '';
  // }

// if (columnName === 'Other Diagnosis') {
//   let diagnosis = '';

//   if (row.clinical_impression) diagnosis = row.clinical_impression;
//   else if (row.diagnosis) diagnosis = row.diagnosis;

//   // Trim any "Others:" prefix and extra spaces
//   if (typeof diagnosis === 'string') {
//     diagnosis = diagnosis.replace(/^Other:\s*/i, '').trim();
//   }

//   return diagnosis || '';
// }

 if (columnName === 'SBP (mmHg)') {
  if (typeof row.bp === 'string' && row.bp.includes('/')) return row.bp.split('/')[0].trim();
  if (typeof row.bp === 'number') return String(row.bp);
  return row.bp || '';
}
if (columnName === 'DBP (mmHg)') {
  if (typeof row.bp === 'string' && row.bp.includes('/')) return row.bp.split('/')[1].trim();
  return '';
} 

  if (columnName === 'Shift_pattern') {
    if (row.shift_pattern) return row.shift_pattern;
    if (typeof row.shift_worker === 'string' && row.shift_worker.toLowerCase() === 'no')
      return '-';
    return '';
  }

  return '';
};
// ...existing code...

/**
 * Flattens nested patient response object, including `response_data` and `scores`.
 */
const flattenPatientResponse = (patientData) => {
  const flat = {};

  const addFields = (obj, prefix = '') => {
    for (const [key, value] of Object.entries(obj)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        addFields(value, `${prefix}${key}.`);
      } else {
        flat[prefix + key] = processValueForExcel(value);
      }
    }
  };

  if (patientData.response_data) {
    const { response_data, ...rest } = patientData;
    Object.entries(rest).forEach(([key, value]) => (flat[key] = processValueForExcel(value)));
    addFields(response_data);
  } else {
    addFields(patientData);
  }

  return flat;
};

/**
 * Safely retrieves nested or flattened values.
 */
const getNestedValue = (obj, path) => {
  if (!obj || typeof obj !== 'object') return undefined;
  if (Object.prototype.hasOwnProperty.call(obj, path)) return obj[path];
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
};

/**
 * Exports array of patient JSON responses to Excel (.xlsx)
 */
export const exportPatientsToExcel = (patientResponses, fileName = 'sleep_responses.xlsx') => {
  if (!Array.isArray(patientResponses) || patientResponses.length === 0) {
    console.error('No data provided for export');
    return;
  }

  const flattenedData = patientResponses.map(flattenPatientResponse);

  // ...existing code...
  const orderedData = flattenedData.map((row) => {
    const orderedRow = {};
    EXCEL_COLUMN_ORDER.forEach((columnName) => {
      // Force special handling first for BP-derived and meds “Others” columns
      if (
        columnName === 'SBP (mmHg)' ||
        columnName === 'DBP (mmHg)' ||
        columnName === 'Others'
      ) {
        orderedRow[columnName] = handleSpecialCases(columnName, row);
        return; // skip mapping for these, special handling is authoritative
      }

      // Try all keys mapped to this column, pick the first non-empty
      const candidateKeys = Object.entries(QUESTION_ID_TO_COLUMN_MAP)
        .filter(([_, v]) => v === columnName)
        .map(([k]) => k);

      for (const key of candidateKeys) {
        const value = getNestedValue(row, key);
        if (value !== undefined && value !== null && String(value) !== '') {
          orderedRow[columnName] = value;
          return;
        }
      }

      if (Object.prototype.hasOwnProperty.call(row, columnName)) {
        orderedRow[columnName] = row[columnName];
      } else {
        orderedRow[columnName] = handleSpecialCases(columnName, row);
      }
    });
    return orderedRow;
  });
// ...existing code...

  const ws = XLSX.utils.json_to_sheet(orderedData);

  // Auto-fit column widths
  const range = XLSX.utils.decode_range(ws['!ref']);
  ws['!cols'] = Array.from({ length: range.e.c - range.s.c + 1 }, (_, c) => {
    let maxWidth = 10;
    for (let r = range.s.r; r <= range.e.r; r++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c: range.s.c + c })];
      if (cell && cell.v) maxWidth = Math.max(maxWidth, String(cell.v).length);
    }
    return { wch: Math.min(Math.max(maxWidth, 10), 50) };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Patient Responses');
  XLSX.writeFile(wb, fileName);

  console.log(`✅ Excel file "${fileName}" created with ${flattenedData.length} records.`);
};

/**
 * Exports a single patient response (for testing)
 */
export const exportSinglePatientToExcel = (singlePatientData, fileName = 'single_patient_response.xlsx') => {
  exportPatientsToExcel([singlePatientData], fileName);
};
