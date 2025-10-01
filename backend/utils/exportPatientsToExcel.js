import XLSX from 'xlsx';
import { STJohnQuestionnaire } from '../STJOHNQuestions.js';
import { EXCEL_COLUMN_ORDER, QUESTION_ID_TO_COLUMN_MAP } from './columnOrder.js';

/**
 * Converts array values to Excel-friendly format
 * @param {*} value - The value to process
 * @returns {*} Excel-friendly value
 */
const processValueForExcel = (value) => {
  if (Array.isArray(value)) {
    // Join array elements with semicolon for Excel
    return value.join('; ');
  }
  return value;
};

/**
 * Handles special cases for column mapping
 * @param {string} columnName - The target column name
 * @param {Object} row - The data row
 * @returns {*} The value for the column
 */
const handleSpecialCases = (columnName, row) => {
  // Handle individual medication fields by checking if they exist in the medications array
  if (columnName === 'Sedative_hypnotics') {
    return Array.isArray(row.medications) && row.medications.includes('Sedative_hypnotics') ? 'Yes' : 'No';
  }
  if (columnName === 'Antidepressants') {
    return Array.isArray(row.medications) && row.medications.includes('Antidepressants') ? 'Yes' : 'No';
  }
  if (columnName === 'Antipsychotics') {
    return Array.isArray(row.medications) && row.medications.includes('Antipsychotics') ? 'Yes' : 'No';
  }
  if (columnName === 'Stimulants') {
    return Array.isArray(row.medications) && row.medications.includes('Stimulants') ? 'Yes' : 'No';
  }
  if (columnName === 'Opioids') {
    return Array.isArray(row.medications) && row.medications.includes('Opioids') ? 'Yes' : 'No';
  }
  if (columnName === 'Others') {
    // For "Others", check if there are any medications not in the standard categories
    if (Array.isArray(row.medications)) {
      const standardMeds = ['Sedative_hypnotics', 'Antidepressants', 'Antipsychotics', 'Stimulants', 'Opioids'];
      const otherMeds = row.medications.filter(med => !standardMeds.includes(med));
      return otherMeds.length > 0 ? 'Yes' : 'No';
    }
    return 'No';
  }
  
  // Handle Type_surgery column - for now, return empty since it's not clearly defined
  if (columnName === 'Type_surgery') {
    return '';
  }
  
  // Handle blood pressure split
  if (columnName === 'SBP (mmHg)') {
    if (row.bp && typeof row.bp === 'string' && row.bp.includes('/')) {
      return row.bp.split('/')[0];
    }
    return row.bp || '';
  }
  
  if (columnName === 'DBP (mmHg)') {
    if (row.bp && typeof row.bp === 'string' && row.bp.includes('/')) {
      return row.bp.split('/')[1];
    }
    return '';
  }
  
  // Handle shift pattern - if no specific shift_pattern field, derive from shift_worker
  if (columnName === 'Shift_pattern') {
    if (row.shift_pattern) {
      return row.shift_pattern;
    }
    if (row.shift_worker && (row.shift_worker.toLowerCase() === 'no' || row.shift_worker.toLowerCase() === 'n')) {
      return 'Regular day shift';
    }
    return '';
  }
  
  return '';
};

/**
 * Flattens a single patient response JSON
 * @param {Object} patientData
 * @returns {Object} flattened object suitable for Excel
 */
const flattenPatientResponse = (patientData) => {
  const flat = {};
  
  // Handle database response structure with response_data field
  if (patientData.response_data) {
    // Merge the response_data with other fields
    const { response_data, ...otherFields } = patientData;
    
    // Add other database fields
    for (const [key, value] of Object.entries(otherFields)) {
      flat[key] = processValueForExcel(value);
    }
    
    // Add response_data fields
    for (const [key, value] of Object.entries(response_data)) {
      flat[key] = processValueForExcel(value);
    }
    
    return flat;
  }
  
  // Handle case where data is already flat (from questionnaire component)
  if (!patientData.responses && !patientData.patientId) {
    // This is likely a flat formData object from the questionnaire
    // Process all values to make them Excel-friendly
    for (const [key, value] of Object.entries(patientData)) {
      flat[key] = processValueForExcel(value);
    }
    return flat;
  }
  
  // Add patientId if available
  if (patientData.patientId) {
    flat.patientId = patientData.patientId;
  }
  
  // Handle nested responses structure
  if (patientData.responses) {
    for (const pageKey in patientData.responses) {
      const page = patientData.responses[pageKey];
      for (const questionKey in page) {
        flat[`${pageKey}_${questionKey}`] = processValueForExcel(page[questionKey]);
      }
    }
  } else {
    // Handle flat structure - process all properties
    for (const [key, value] of Object.entries(patientData)) {
      if (key !== 'patientId') { // Don't duplicate patientId
        flat[key] = processValueForExcel(value);
      }
    }
  }

  return flat;
};

/**
 * Organizes flat questionnaire data by pages based on STJohnQuestionnaire structure
 * @param {Object} flatData - Flat questionnaire responses
 * @returns {Object} organized by pages
 */
const organizeDataByPages = (flatData) => {
  const organized = {
    patientId: flatData.patientId || `patient_${Date.now()}`,
    responses: {}
  };

  STJohnQuestionnaire.forEach((page) => {
    const pageKey = `page${page.page}`;
    organized.responses[pageKey] = {};
    
    page.questions.forEach((question) => {
      if (flatData[question.id] !== undefined) {
        organized.responses[pageKey][question.id] = flatData[question.id];
      }
    });
  });

  return organized;
};

/**
 * Creates readable column headers based on question structure
 * @returns {Object} mapping of question IDs to readable labels
 */
const createColumnHeaders = () => {
  const headers = {};
  
  STJohnQuestionnaire.forEach((page) => {
    page.questions.forEach((question) => {
      headers[question.id] = question.label;
    });
  });
  
  return headers;
};

/**
 * Gets the correct column order based on questionnaire structure
 * @returns {Array} ordered array of question IDs
 */
const getColumnOrder = () => {
  const order = ['patientId']; // Start with patientId if available
  
  STJohnQuestionnaire.forEach((page) => {
    page.questions.forEach((question) => {
      order.push(question.id);
    });
  });
  
  return order;
};

/**
 * Exports array of patient JSON responses to Excel (.xlsx)
 * @param {Array} patientResponses - Array of patient JSON objects
 * @param {String} fileName - Output file name (e.g., "sleep_responses.xlsx")
 * @param {Object} options - Export options
 */
export const exportPatientsToExcel = (patientResponses, fileName = 'sleep_responses.xlsx', options = {}) => {
  console.log('Input data:', patientResponses);
  
  if (!Array.isArray(patientResponses) || patientResponses.length === 0) {
    console.error('No data provided for export');
    return;
  }

  const flattenedData = patientResponses.map(flattenPatientResponse);
  console.log('Flattened data:', flattenedData);

  // Create a new workbook
  const wb = XLSX.utils.book_new();

  // Map and order the data according to the specified column order
  const orderedData = flattenedData.map(row => {
    const orderedRow = {};
    EXCEL_COLUMN_ORDER.forEach(columnName => {
      // Find the corresponding question ID for this column
      const questionId = Object.entries(QUESTION_ID_TO_COLUMN_MAP)
        .find(([_, value]) => value === columnName)?.[0];
      
      // If we found a matching question ID, use its value
      if (questionId && row.hasOwnProperty(questionId)) {
        orderedRow[columnName] = row[questionId];
      } else {
        // Try to find the value directly by column name (exact match)
        if (row.hasOwnProperty(columnName)) {
          orderedRow[columnName] = row[columnName];
        } else {
          // Handle special cases for missing fields
          orderedRow[columnName] = handleSpecialCases(columnName, row);
        }
      }
    });
    return orderedRow;
  });

  // Create worksheet with ordered data
  const ws = XLSX.utils.json_to_sheet(orderedData);

  // Auto-fit column widths
  const range = XLSX.utils.decode_range(ws['!ref']);
  const colWidths = [];
  
  // Calculate maximum width for each column
  for (let col = range.s.c; col <= range.e.c; col++) {
    let maxWidth = 10; // Minimum width
    
    // Check header width
    const headerCell = ws[XLSX.utils.encode_cell({ r: 0, c: col })];
    if (headerCell && headerCell.v) {
      maxWidth = Math.max(maxWidth, String(headerCell.v).length);
    }
    
    // Check data cell widths
    for (let row = range.s.r + 1; row <= range.e.r; row++) {
      const cell = ws[XLSX.utils.encode_cell({ r: row, c: col })];
      if (cell && cell.v) {
        const cellValue = String(cell.v);
        maxWidth = Math.max(maxWidth, cellValue.length);
      }
    }
    
    // Set reasonable limits (minimum 10, maximum 50 characters)
    colWidths.push({ wch: Math.min(Math.max(maxWidth, 10), 50) });
  }
  
  // Apply column widths
  ws['!cols'] = colWidths;

  // Headers are already properly set by using EXCEL_COLUMN_ORDER
  // No need for additional header processing since column names are already in the desired format

  // Append worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Patient Responses');

  // Write workbook to file
  XLSX.writeFile(wb, fileName);

  console.log(`Excel file "${fileName}" created successfully with ${flattenedData.length} patient records.`);
};

/**
 * Exports a single patient response (for testing)
 * @param {Object} singlePatientData - Single patient response object
 * @param {String} fileName - Output file name
 */
export const exportSinglePatientToExcel = (singlePatientData, fileName = 'single_patient_response.xlsx') => {
  console.log('Exporting single patient data:', singlePatientData);
  exportPatientsToExcel([singlePatientData], fileName);
};




