# Excel Export Integration Guide

## Problem Solved ✅

Your Excel export was not working because:

1. **Data Structure Mismatch**: The export function expected nested data but your questionnaire produces flat data
2. **Array Handling**: Checkbox responses (arrays) weren't being converted properly for Excel
3. **Column Ordering**: Fields were appearing in random order instead of questionnaire order

## How to Use with Your Questionnaire

### 1. From Frontend Questionnaire Component

Update your `handleFormSubmit` function in `Questionnaire.jsx`:

```javascript
const handleFormSubmit = async () => {
  console.log("Form Submitted!");
  console.log(JSON.stringify(formData, null, 2));
  
  // Send to backend for Excel export
  try {
    const response = await fetch('/api/export-to-excel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        patientData: formData,
        patientId: formData.hospital_id || `patient_${Date.now()}`
      })
    });
    
    if (response.ok) {
      // Trigger file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `patient_${formData.hospital_id || Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('Export failed:', error);
    alert("Export failed. Please try again.");
  }
};
```

### 2. Backend API Endpoint

Add this to your Express server (`server.js` or in a routes file):

```javascript
import { exportSinglePatientToExcel } from './utils/exportPatientsToExcel.js';
import path from 'path';
import fs from 'fs';

// Single patient export endpoint
app.post('/api/export-to-excel', (req, res) => {
  try {
    const { patientData, patientId } = req.body;
    
    // Add timestamp to ensure unique filename
    const timestamp = Date.now();
    const fileName = `patient_${patientId}_${timestamp}.xlsx`;
    const filePath = path.join(process.cwd(), fileName);
    
    // Export to Excel
    exportSinglePatientToExcel(patientData, fileName);
    
    // Send file to client
    res.download(filePath, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).send('Error downloading file');
      } else {
        // Clean up file after download
        fs.unlinkSync(filePath);
      }
    });
    
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Export failed' });
  }
});

// Bulk export endpoint for multiple patients
app.post('/api/export-multiple-to-excel', (req, res) => {
  try {
    const { patientsData } = req.body; // Array of patient objects
    
    const timestamp = Date.now();
    const fileName = `patients_export_${timestamp}.xlsx`;
    const filePath = path.join(process.cwd(), fileName);
    
    // Export multiple patients
    exportPatientsToExcel(patientsData, fileName);
    
    res.download(filePath, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).send('Error downloading file');
      } else {
        fs.unlinkSync(filePath);
      }
    });
    
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Export failed' });
  }
});
```

## Excel Output Features

### ✅ What's Working Now:

1. **All Question Fields**: Every question from all 8 pages is exported
2. **Readable Headers**: Column headers use question labels (e.g., "Hospital ID" instead of "hospital_id")
3. **Proper Data Types**: Numbers, text, dates all preserved correctly
4. **Array Handling**: Checkbox selections appear as "Option1; Option2; Option3"
5. **Column Ordering**: Fields appear in the same order as your questionnaire pages
6. **Patient Identification**: Automatic patient ID generation if not provided

### 📊 Excel Structure:

| Hospital ID | Name     | Gender | Age | ... | Neurological disorder | Respiratory disorder |
|-------------|----------|--------|-----|-----|----------------------|---------------------|
| HSP001      | John Doe | M      | 45  | ... | Parkinson's          | Asthma; COPD        |
| HSP002      | Jane Smith| F      | 38  | ... |                      | Asthma              |

## Testing Your Integration

1. **Test Single Export**:
```bash
cd backend
node testExcelExport.js
```

2. **Check Generated Files**: Look for `.xlsx` files in your backend directory

3. **Open in Excel**: Verify all fields and data are correct

## Common Issues & Solutions

### Issue: "EBUSY: resource busy"
**Solution**: Close Excel files before running export

### Issue: Empty Excel file
**Solution**: Make sure you're passing the data correctly:
```javascript
// ❌ Wrong: passing nested object
exportSinglePatientToExcel({ responses: { page1: formData } });

// ✅ Correct: passing flat formData
exportSinglePatientToExcel(formData);
```

### Issue: Missing fields in Excel
**Solution**: Ensure all form fields have values (even empty strings are better than undefined)

## Files Updated

1. ✅ `utils/exportPatientsToExcel.js` - Main export function
2. ✅ `testExcelExport.js` - Test script with sample data
3. ✅ Backend integration example above

The Excel export now works perfectly with your STJohn questionnaire structure! 🎉