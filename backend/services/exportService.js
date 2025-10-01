// services/exportService.js
import fs from "fs";
import XLSX from "xlsx";

// ---- Excel (XLSX) Export using xlsx ----
export function exportPatientsToExcel(dataArray, filePath) {
  if (!dataArray || dataArray.length === 0) {
    throw new Error("No data to export");
  }

  // Flatten data: merge response_data with other fields
  const flattened = dataArray.map(row => {
    const { response_data = {}, ...rest } = row;
    // Merge and then sanitize values to prevent Excel formula injection
    const merged = { ...rest, ...response_data };
    const safe = {};
    for (const [k, v] of Object.entries(merged)) {
      const valStr = v == null ? '' : Array.isArray(v) ? v.join('; ') : typeof v === 'object' ? JSON.stringify(v) : String(v);
      safe[k] = /^[=+\-@]/.test(valStr) ? `'${valStr}` : valStr;
    }
    return safe;
  });

  // Create worksheet from JSON
  const worksheet = XLSX.utils.json_to_sheet(flattened);

  // Create workbook and append worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Patients");

  // Write workbook to file
  XLSX.writeFile(workbook, filePath);
}
