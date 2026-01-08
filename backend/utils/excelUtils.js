// --- Helper: safely fetch nested values (like "scores.epworthScore") ---
function getValueByPath(obj, path) {
  return path.split('.').reduce((acc, part) => (acc ? acc[part] : undefined), obj);
}

// --- Main Function: build Excel-ready row object ---
export function buildExcelRow(responseData, QUESTION_ID_TO_COLUMN_MAP, EXCEL_COLUMN_ORDER) {
  const excelRow = {};

  // 1️⃣ Initialize all columns as blank
  for (const col of EXCEL_COLUMN_ORDER) {
    excelRow[col] = '';
  }

  // 2️⃣ Fill in mapped values
  for (const [field, column] of Object.entries(QUESTION_ID_TO_COLUMN_MAP)) {
    let value = getValueByPath(responseData, field);

    // 🩸 Handle BP split
    if (field === 'bp' && value) {
      const [systolic, diastolic] = value.split('/');
      excelRow['SBP (mmHg)'] = systolic?.trim() || '';
      excelRow['DBP (mmHg)'] = diastolic?.trim() || '';
      continue;
    }

    // 💊 Handle medication fields (arrays)
    if (Array.isArray(value)) {
      value = value.join(', ');
    }

    // 🧾 Handle recommendation arrays
    if (field === 'recommended_workup' && Array.isArray(value)) {
      value = value.join('; ');
    }

    // 🧠 Ensure correct assignment
    if (column in excelRow) {
      excelRow[column] = value ?? '';
    }
  }

  return excelRow;
}
