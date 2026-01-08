import XLSX from 'xlsx';

// Read the Excel file
const workbook = XLSX.readFile('test-output.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Get range and read data
const range = XLSX.utils.decode_range(worksheet['!ref']);
console.log('Excel file inspection:');
console.log('======================');

// Get headers (first row)
const headers = [];
for (let col = range.s.c; col <= range.e.c; col++) {
  const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
  const cell = worksheet[cellAddress];
  if (cell && cell.v) {
    headers.push(cell.v);
  }
}

console.log('Column headers in order:');
headers.forEach((header, index) => {
  console.log(`${index + 1}. ${header}`);
});

console.log('\nFirst row data:');
const firstRowData = {};
for (let col = range.s.c; col <= range.e.c; col++) {
  const headerCell = worksheet[XLSX.utils.encode_cell({ r: 0, c: col })];
  const dataCell = worksheet[XLSX.utils.encode_cell({ r: 1, c: col })];
  
  if (headerCell && headerCell.v) {
    firstRowData[headerCell.v] = dataCell ? dataCell.v : '';
  }
}

console.log(JSON.stringify(firstRowData, null, 2));