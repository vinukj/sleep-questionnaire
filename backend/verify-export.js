import XLSX from 'xlsx';

// Read the Excel file
const workbook = XLSX.readFile('test-output-new.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert to JSON
const data = XLSX.utils.sheet_to_json(worksheet);

console.log('Excel Export Verification:');
console.log('=========================');

if (data.length > 0) {
  const firstRow = data[0];
  
  console.log('\nMedication columns:');
  console.log('Sedative_hypnotics:', firstRow['Sedative_hypnotics']);
  console.log('Antidepressants:', firstRow['Antidepressants']);
  console.log('Antipsychotics:', firstRow['Antipsychotics']);
  console.log('Stimulants:', firstRow['Stimulants']);
  console.log('Opioids:', firstRow['Opioids']);
  console.log('Others:', firstRow['Others']);
  
  console.log('\nOther key fields:');
  console.log('Hospital_ID:', firstRow['Hospital_ID']);
  console.log('Name:', firstRow['Name']);
  console.log('Age (years):', firstRow['Age (years)']);
  console.log('Gender:', firstRow['Gender']);
  console.log('SBP (mmHg):', firstRow['SBP (mmHg)']);
  console.log('DBP (mmHg):', firstRow['DBP (mmHg)']);
  
  console.log('\nColumn headers available:');
  console.log(Object.keys(firstRow).slice(0, 20).join(', '), '...');
} else {
  console.log('No data found in Excel file');
}