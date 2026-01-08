import XLSX from 'xlsx';

// Read the Excel file
const workbook = XLSX.readFile('test-output-new.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

console.log('Column Width Verification:');
console.log('=========================');

if (worksheet['!cols']) {
  console.log('Column widths have been set:');
  worksheet['!cols'].forEach((col, index) => {
    // Get the header for this column
    const headerCell = worksheet[XLSX.utils.encode_cell({ r: 0, c: index })];
    const headerName = headerCell ? headerCell.v : `Column ${index + 1}`;
    console.log(`${index + 1}. ${headerName}: ${col.wch} characters`);
  });
} else {
  console.log('No column widths found - using default widths');
}

// Also show first few column headers for verification
console.log('\nFirst 10 column headers:');
const range = XLSX.utils.decode_range(worksheet['!ref']);
for (let col = range.s.c; col < Math.min(range.s.c + 10, range.e.c + 1); col++) {
  const headerCell = worksheet[XLSX.utils.encode_cell({ r: 0, c: col })];
  if (headerCell && headerCell.v) {
    console.log(`${col + 1}. ${headerCell.v}`);
  }
}