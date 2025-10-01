# Excel Export Button Component

## 🚀 Quick Start

The `ExcelExportButton` is a reusable React component that allows users to export data to Excel (.xlsx) or CSV format with a beautiful Material-UI interface.

## 📋 Usage Examples

### Basic Usage
```jsx
import ExcelExportButton from '../components/ExcelExportButton.jsx';

const myData = {
  patientId: "P001",
  name: "John Doe",
  age: 45,
  diagnosis: "Sleep Apnea"
};

<ExcelExportButton
  data={myData}
  fileName="patient_data"
/>
```

### Multiple Patients Export
```jsx
const patientsArray = [
  { patientId: "P001", name: "John Doe", age: 45 },
  { patientId: "P002", name: "Jane Smith", age: 38 }
];

<ExcelExportButton
  data={patientsArray}
  fileName="all_patients"
  variant="contained"
  color="primary"
  onExportComplete={(format, fileName) => {
    console.log(`Export completed: ${fileName}`);
  }}
/>
```

### CSV Only Export (No Dropdown)
```jsx
<ExcelExportButton
  data={myData}
  fileName="simple_export"
  showDropdown={false}
  variant="outlined"
  color="secondary"
/>
```

### With Event Handlers
```jsx
const [exportStatus, setExportStatus] = useState('');

<ExcelExportButton
  data={patientData}
  fileName="patient_responses"
  onExportStart={(format) => {
    setExportStatus(`Starting ${format} export...`);
  }}
  onExportComplete={(format, fileName) => {
    setExportStatus(`✅ Export completed: ${fileName}`);
  }}
  onExportError={(error) => {
    setExportStatus(`❌ Export failed: ${error}`);
  }}
/>
```

## 🎛️ Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `Object|Array` | **Required** | Data to export (single object or array) |
| `fileName` | `string` | `'export'` | Base filename (without extension) |
| `variant` | `string` | `'contained'` | MUI Button variant |
| `size` | `string` | `'medium'` | MUI Button size |
| `color` | `string` | `'primary'` | MUI Button color |
| `showDropdown` | `boolean` | `true` | Show format selection dropdown |
| `disabled` | `boolean` | `false` | Disable the button |
| `onExportStart` | `function` | `undefined` | Called when export starts |
| `onExportComplete` | `function` | `undefined` | Called when export completes |
| `onExportError` | `function` | `undefined` | Called when export fails |

## 🎨 Styling Options

### Button Variants
```jsx
{/* Filled button */}
<ExcelExportButton variant="contained" color="primary" />

{/* Outlined button */}
<ExcelExportButton variant="outlined" color="secondary" />

{/* Text button */}
<ExcelExportButton variant="text" color="info" />
```

### Sizes
```jsx
{/* Small */}
<ExcelExportButton size="small" />

{/* Medium (default) */}
<ExcelExportButton size="medium" />

{/* Large */}
<ExcelExportButton size="large" />
```

### Colors
```jsx
<ExcelExportButton color="primary" />
<ExcelExportButton color="secondary" />
<ExcelExportButton color="success" />
<ExcelExportButton color="error" />
<ExcelExportButton color="info" />
<ExcelExportButton color="warning" />
```

## 📊 Export Formats

### Excel (.xlsx)
- ✅ Rich formatting support
- ✅ Readable column headers
- ✅ Proper data types (numbers, dates, text)
- ✅ Array handling (semicolon-separated)
- ✅ Larger file size but more features

### CSV (.csv)
- ✅ Universal compatibility 
- ✅ Smaller file size
- ✅ Plain text format
- ✅ Easy to import anywhere
- ❌ No formatting or formulas

## 🔧 Backend Integration

The component automatically calls your backend API:

```javascript
// Frontend automatically calls:
POST /api/export-to-excel
{
  "patientsData": [...],
  "fileName": "export_123456789.xlsx",
  "format": "excel" // or "csv"
}
```

Make sure your backend has the export route configured (already included in your setup).

## 📱 Responsive Design

The component is fully responsive and works on:
- ✅ Desktop computers
- ✅ Tablets
- ✅ Mobile phones
- ✅ All screen sizes

## 🎯 Use Cases

1. **Single Patient Export**: Export one patient's questionnaire responses
2. **Bulk Export**: Export all patients for research analysis  
3. **Filtered Export**: Export specific patient groups
4. **Report Generation**: Create formatted reports for doctors
5. **Data Backup**: Regular data backups in Excel format
6. **Research Data**: Export for statistical analysis software

## 🚨 Error Handling

The component handles various error scenarios:
- ❌ No data provided
- ❌ Network connection issues
- ❌ Backend server errors
- ❌ File generation failures
- ❌ Browser download restrictions

## 🔒 Security Notes

- Files are temporarily stored on server and auto-deleted
- No sensitive data is logged
- Proper CORS handling for downloads
- Secure filename generation

## 💡 Tips

1. **Filename Convention**: Use descriptive names like `sleep_study_2025_01`
2. **Data Preparation**: Ensure your data objects have consistent field names
3. **Performance**: For large datasets (>1000 records), consider pagination
4. **User Feedback**: Always use the event handlers to show export status
5. **Mobile**: Test download functionality on mobile devices

## 🔄 Integration with Your Questionnaire

```jsx
// In your Questionnaire component's handleFormSubmit:
const handleFormSubmit = () => {
  // ... existing logic ...
  
  // Add export functionality
  const exportPatientData = () => {
    return (
      <ExcelExportButton
        data={formData}
        fileName={`patient_${formData.hospital_id}_${Date.now()}`}
        variant="outlined"
        color="success"
        size="small"
        onExportComplete={() => {
          alert('Patient data exported successfully!');
        }}
      />
    );
  };
};
```