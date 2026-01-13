#!/usr/bin/env python3
"""
Table Extraction & Pre-processing Service
Extracts tables from .docx files, labels them, and structures data for LLM extraction
"""

import json
import sys
import re
from docx import Document


# Table type detection patterns
TABLE_PATTERNS = {
    'PATIENT_INFO': {
        'keywords': ['patient name', 'sex', 'd.o.b', 'age', 'height', 'weight', 'b.m.i', 'op/ip'],
        'priority': 10
    },
    'REPORT_HEADER': {
        'keywords': ['split night report', 'diagnostic report', 'titration report', 'psg report'],
        'priority': 9
    },
    'SLEEP_ARCHITECTURE': {
        'keywords': ['sleep architecture', 'lights off', 'lights on', 'total recording time', 'sleep efficiency', 'waso'],
        'priority': 8
    },
    'SLEEP_STAGING': {
        'keywords': ['sleep staging', 'n 1', 'n 2', 'n 3', 'stage', '% tst', 'latency'],
        'priority': 7
    },
    'RESPIRATORY_EVENTS': {
        'keywords': ['ca', 'oa', 'ma', 'apnea', 'hypop', 'a + h', 'rera', 'index (#/h'],
        'priority': 6
    },
    'POSITIONAL_DATA': {
        'keywords': ['supine', 'prone', 'left', 'right', 'up:', 'duration', 'ahi', 'rdi', 'desat'],
        'priority': 5
    },
    'AROUSALS': {
        'keywords': ['arousal', 'awakening', 'respiratory:', 'leg movement', 'snore:', 'spontaneous:', 'ar + aw'],
        'priority': 4
    },
    'SNORING_SUMMARY': {
        'keywords': ['snoring summary', 'snoring episodes', 'time with snoring'],
        'priority': 3
    },
    'OXYGEN_SATURATION': {
        'keywords': ['spo2', 'desats', 'rel desats', '<=89%', '<95%', '<90%', 'mean spo2', 'minimum spo2'],
        'priority': 2
    },
    'CARDIAC_SUMMARY': {
        'keywords': ['cardiac summary', 'heart rate', 'average heart rate', 'highest heart rate', 'lowest heart rate'],
        'priority': 1
    },
    'CARDIAC_EVENTS': {
        'keywords': ['cardiac event', 'bradycardia', 'tachycardia', 'asystole', 'atrial fibrillation'],
        'priority': 1
    },
    'CPAP_TITRATION': {
        'keywords': ['cpap', 'pressure', 'tib', 'apneas', 'hypopneas', 'reras', 'min spo2'],
        'priority': 1
    }
}


def extract_tables_from_docx(docx_path):
    """Extract all tables from a DOCX file."""
    try:
        doc = Document(docx_path)
        tables_out = []
        
        for ti, table in enumerate(doc.tables):
            rows = []
            for row in table.rows:
                rows.append([cell.text.strip() for cell in row.cells])
            
            tables_out.append({
                "table_index": ti,
                "rows": rows,
                "row_count": len(rows),
                "col_count": len(rows[0]) if rows else 0
            })
        
        return tables_out
    except Exception as e:
        return []


def detect_table_type(table):
    """
    Detect the type/category of a table based on its content.
    Returns the table type and confidence score.
    """
    rows = table.get('rows', [])
    if not rows:
        return 'UNKNOWN', 0
    
    # Flatten all text in table to lowercase for matching
    all_text = ' '.join([' '.join(row) for row in rows]).lower()
    
    # Check first row for explicit headers (merged cells often repeat)
    first_row_text = ' '.join(rows[0]).lower() if rows else ''
    
    best_match = ('UNKNOWN', 0)
    
    for table_type, config in TABLE_PATTERNS.items():
        keywords = config['keywords']
        priority = config['priority']
        
        # Count keyword matches~
        matches = sum(1 for kw in keywords if kw in all_text)
        
        # Boost score if keyword is in first row (likely header)
        first_row_matches = sum(1 for kw in keywords if kw in first_row_text)
        
        # Calculate score
        score = matches + (first_row_matches * 2) + (priority * 0.1)
        
        if score > best_match[1]:
            best_match = (table_type, score)
    
    return best_match


def get_table_heading(table_type, table):
    """
    Generate a human-readable heading for the table.
    """
    rows = table.get('rows', [])
    
    # Check if first row has an explicit title (all cells same value)
    if rows:
        first_row = rows[0]
        unique_values = set(cell.strip() for cell in first_row if cell.strip())
        if len(unique_values) == 1:
            explicit_title = list(unique_values)[0]
            if len(explicit_title) > 3 and len(explicit_title) < 50:
                return explicit_title
    
    # Map table types to readable headings
    heading_map = {
        'PATIENT_INFO': 'Patient Information',
        'REPORT_HEADER': 'Report Header',
        'SLEEP_ARCHITECTURE': 'Sleep Architecture',
        'SLEEP_STAGING': 'Sleep Staging',
        'RESPIRATORY_EVENTS': 'Respiratory Events',
        'POSITIONAL_DATA': 'Positional Data',
        'AROUSALS': 'Arousals & Awakenings',
        'SNORING_SUMMARY': 'Snoring Summary',
        'OXYGEN_SATURATION': 'Oxygen Saturation (SpO2)',
        'CARDIAC_SUMMARY': 'Cardiac Summary',
        'CARDIAC_EVENTS': 'Cardiac Event Observations',
        'CPAP_TITRATION': 'CPAP Titration Data',
        'UNKNOWN': 'Unclassified Table'
    }
    
    return heading_map.get(table_type, 'Unclassified Table')


def parse_numeric_value(text):
    """Parse a text value to extract numeric data."""
    if not text or text.strip() in ['-', '', 'N/A', 'None']:
        return None
    
    text = text.strip()
    
    # Pattern: "value unit" - e.g., "527.6 minutes", "71.5 %", "78.6 bpm"
    match = re.match(r'^([\d.,]+)\s*(.*)$', text)
    if match:
        try:
            value = float(match.group(1).replace(',', ''))
            unit = match.group(2).strip()
            if unit:
                return {'value': value, 'unit': unit}
            return value
        except:
            pass
    
    # Return as string if not numeric
    return text


def extract_key_value_pairs(rows):
    """
    Extract key-value pairs from a simple 2-column table.
    """
    data = {}
    for row in rows:
        if len(row) >= 2:
            key = row[0].strip().rstrip(':')
            value = row[1].strip()
            if key and value and key.lower() != value.lower():
                parsed = parse_numeric_value(value)
                if parsed is not None:
                    data[key] = parsed
    return data


def extract_grid_data(rows, header_row_idx=0):
    """
    Extract data from a grid table with column headers.
    Returns column headers and row data.
    """
    if not rows or header_row_idx >= len(rows):
        return None
    
    headers = [h.strip() for h in rows[header_row_idx]]
    
    # Clean up headers (remove newlines, normalize)
    headers = [re.sub(r'\s+', ' ', h) for h in headers]
    
    data_rows = []
    for i, row in enumerate(rows):
        if i <= header_row_idx:
            continue
        
        # Skip empty rows
        if all(cell.strip() == '' for cell in row):
            continue
        
        row_data = {}
        row_label = row[0].strip().rstrip(':') if row else ''
        
        for j, cell in enumerate(row):
            if j < len(headers) and headers[j]:
                parsed = parse_numeric_value(cell)
                if parsed is not None:
                    row_data[headers[j]] = parsed
        
        if row_data:
            if row_label and row_label not in ['', headers[0] if headers else '']:
                row_data['_label'] = row_label
            data_rows.append(row_data)
    
    return {
        'headers': [h for h in headers if h],
        'rows': data_rows
    }


def structure_table(table, table_type):
    """
    Structure a single table based on its detected type.
    """
    rows = table.get('rows', [])
    if not rows:
        return {}
    
    # Skip tables with only one cell containing "None"
    if len(rows) == 1 and len(rows[0]) == 1 and rows[0][0].lower() == 'none':
        return {'_empty': True}
    
    # Different extraction strategies based on table type
    if table_type in ['SLEEP_ARCHITECTURE', 'SNORING_SUMMARY', 'CARDIAC_SUMMARY']:
        # These are typically key-value tables (skip header row if present)
        start_row = 1 if len(rows) > 1 and len(set(rows[0])) == 1 else 0
        return extract_key_value_pairs(rows[start_row:])
    
    elif table_type == 'PATIENT_INFO':
        # Patient info often has multiple key-value pairs per row
        data = {}
        for row in rows:
            # Skip header row
            if len(set(row)) == 1:
                continue
            # Process pairs in the row
            for i in range(0, len(row) - 1, 2):
                key = row[i].strip().rstrip(':')
                value = row[i + 1].strip() if i + 1 < len(row) else ''
                if key and value:
                    data[key] = parse_numeric_value(value) or value
        return data
    
    elif table_type in ['RESPIRATORY_EVENTS', 'CPAP_TITRATION']:
        # Grid tables - find header row
        header_idx = 0
        for i, row in enumerate(rows):
            # Header row usually has CA, OA, MA or CPAP, TIB, etc.
            row_text = ' '.join(row).lower()
            if any(kw in row_text for kw in ['ca', 'oa', 'ma', 'apnea', 'cpap', 'tib']):
                header_idx = i
                break
        return extract_grid_data(rows, header_idx)
    
    elif table_type == 'SLEEP_STAGING':
        # Sleep staging has specific format
        data = {'stages': {}}
        for row in rows:
            if len(row) >= 3:
                stage = row[0].strip().rstrip(':')
                if stage.upper() in ['N 1', 'N 2', 'N 3', 'R', 'N1', 'N2', 'N3']:
                    data['stages'][stage] = {
                        'duration': parse_numeric_value(row[1]) if len(row) > 1 else None,
                        'percent_tst': parse_numeric_value(row[2]) if len(row) > 2 else None
                    }
        return data
    
    elif table_type in ['AROUSALS', 'POSITIONAL_DATA', 'OXYGEN_SATURATION']:
        # Grid tables
        return extract_grid_data(rows, 0)
    
    elif table_type == 'CARDIAC_EVENTS':
        # Yes/No table
        data = {}
        for row in rows:
            if len(row) >= 3:
                event_type = row[0].strip().rstrip(':')
                yes_val = '✓' in row[1] or '✔' in row[1] if len(row) > 1 else False
                no_val = '✓' in row[2] or '✔' in row[2] if len(row) > 2 else False
                if event_type and event_type.upper() != 'TYPE':
                    data[event_type] = 'Yes' if yes_val else ('No' if no_val else 'Unknown')
        return data
    
    # Default: try key-value extraction
    return extract_key_value_pairs(rows)


def label_and_structure_tables(tables):
    """
    Main function to label each table and structure its data.
    Returns tables with headings and structured data.
    """
    labeled_tables = []
    
    for table in tables:
        table_type, confidence = detect_table_type(table)
        heading = get_table_heading(table_type, table)
        structured_data = structure_table(table, table_type)
        
        labeled_tables.append({
            'table_index': table.get('table_index'),
            'heading': heading,
            'table_type': table_type,
            'confidence': round(confidence, 2),
            'structured_data': structured_data,
            'row_count': table.get('row_count'),
            'col_count': table.get('col_count')
        })
    
    return labeled_tables


def parse_value_with_index(text):
    """Parse values like '45 (10.5)' into count and index."""
    if not text or text == '-' or text == '':
        return None
    
    # Pattern: number (index) - e.g., "45 (10.5)"
    match = re.match(r'(\d+(?:\.\d+)?)\s*\((\d+(?:\.\d+)?)\)', text)
    if match:
        return {"count": float(match.group(1)), "index": float(match.group(2))}
    
    # Try to parse as just a number
    try:
        return float(text.replace(',', ''))
    except:
        return text


def is_header_row(row):
    """Check if row looks like a header row."""
    headers = ['diagnostic', 'cpap', 'titration', 'parameter', 'value', 'unit']
    row_text = ' '.join(row).lower()
    return any(h in row_text for h in headers)


def find_diagnostic_column(headers):
    """Find the index of the diagnostic column."""
    for i, h in enumerate(headers):
        h_lower = h.lower()
        if 'diagnostic' in h_lower or 'baseline' in h_lower:
            return i
    return None


def structure_tables(tables):
    """
    Pre-process tables into structured key-value pairs.
    Focuses on extracting DIAGNOSTIC values only.
    """
    structured = {}
    
    # Known field mappings (table label -> JSON field name)
    field_mappings = {
        # Patient info
        'first name': 'firstName',
        'last name': 'lastName',
        'patient id': 'patientId',
        'id': 'patientId',
        'date of birth': 'dateOfBirth',
        'dob': 'dateOfBirth',
        'age': 'age',
        'sex': 'sex',
        'gender': 'sex',
        'height': 'height',
        'weight': 'weight',
        'bmi': 'bmi',
        'measurement date': 'measurementDate',
        'study date': 'measurementDate',
        
        # Study timing
        'lights off': 'lightsOffTime',
        'lights on': 'lightsOnTime',
        'total recording time': 'totalRecordingTime',
        'trt': 'totalRecordingTime',
        'total sleep time': 'totalSleepTime',
        'tst': 'totalSleepTime',
        'sleep efficiency': 'sleepEfficiency',
        'se': 'sleepEfficiency',
        'sleep latency': 'sleepLatency',
        'sol': 'sleepLatency',
        'waso': 'waso',
        'wake after sleep onset': 'waso',
        
        # REM
        'rem latency': 'remLatencyFromSleepOnset',
        'rem latency from sleep onset': 'remLatencyFromSleepOnset',
        'rem latency from lights off': 'remLatencyFromLightsOff',
        
        # Sleep stages
        'n1': 'n1',
        'stage 1': 'n1',
        'n2': 'n2',
        'stage 2': 'n2',
        'n3': 'n3',
        'stage 3': 'n3',
        'deep sleep': 'n3',
        'rem': 'rem',
        'stage rem': 'rem',
        
        # Respiratory
        'central apnea': 'centralApnea',
        'ca': 'centralApnea',
        'obstructive apnea': 'obstructiveApnea',
        'oa': 'obstructiveApnea',
        'mixed apnea': 'mixedApnea',
        'ma': 'mixedApnea',
        'total apnea': 'totalApnea',
        'hypopnea': 'hypopnea',
        'ahi': 'apneaHypopnea',
        'apnea hypopnea': 'apneaHypopnea',
        'a+h': 'apneaHypopnea',
        'rera': 'rera',
        'rdi': 'rdi',
        'rem rdi': 'remRdi',
        'nrem rdi': 'nremRdi',
        
        # Positional
        'supine ahi': 'supineAhi',
        'supine rdi': 'supineRdi',
        
        # Arousals
        'arousal': 'arousalsTotal',
        'arousals': 'arousalsTotal',
        'total arousals': 'arousalsTotal',
        'arousal index': 'arousalIndex',
        'ai': 'arousalIndex',
        
        # Oxygen
        'min spo2': 'minimumSpO2',
        'minimum spo2': 'minimumSpO2',
        'lowest spo2': 'minimumSpO2',
        'mean spo2': 'meanSpO2',
        'average spo2': 'meanSpO2',
        'hypoxic burden': 'hypoxicBurden',
        'hb': 'hypoxicBurden',
        
        # Cardiac
        'heart rate avg': 'heartRateAverage',
        'hr avg': 'heartRateAverage',
        'average hr': 'heartRateAverage',
        'heart rate max': 'heartRateHighest',
        'hr max': 'heartRateHighest',
        'heart rate min': 'heartRateLowest',
        'hr min': 'heartRateLowest',
        
        # Titration
        'cpap pressure': 'pressureSetting',
        'pressure': 'pressureSetting',
        'mask': 'maskInterface',
        'mask type': 'maskInterface',
        'device': 'deviceType',
        'device type': 'deviceType',
    }
    
    for table in tables:
        rows = table['rows']
        if not rows:
            continue
        
        diagnostic_col = None
        header_row_idx = None
        
        # Find header row and diagnostic column
        for i, row in enumerate(rows):
            if is_header_row(row):
                header_row_idx = i
                diagnostic_col = find_diagnostic_column(row)
                break
        
        # Process rows
        for i, row in enumerate(rows):
            if i == header_row_idx:
                continue
            
            if len(row) < 2:
                continue
            
            # First column is usually the label
            label = row[0].lower().strip()
            
            # Get the value - prefer diagnostic column if identified
            if diagnostic_col is not None and diagnostic_col < len(row):
                value = row[diagnostic_col]
            else:
                # Use second column or last non-empty column
                value = row[1] if len(row) > 1 else row[0]
            
            # Map to known field
            for pattern, field_name in field_mappings.items():
                if pattern in label:
                    parsed_value = parse_value_with_index(value)
                    if parsed_value is not None:
                        structured[field_name] = parsed_value
                    break
    
    return structured


def format_for_llm(labeled_tables, structured_data):
    """
    Format extracted data concisely for LLM consumption.
    Returns a compact string representation with labeled tables.
    """
    output_lines = []
    
    # Add pre-structured data
    if structured_data:
        output_lines.append("=== PRE-EXTRACTED VALUES ===")
        for key, value in structured_data.items():
            if isinstance(value, dict):
                if 'count' in value and 'index' in value:
                    output_lines.append(f"  {key}: count={value.get('count')}, index={value.get('index')}")
                elif 'value' in value and 'unit' in value:
                    output_lines.append(f"  {key}: {value.get('value')} {value.get('unit')}")
                else:
                    output_lines.append(f"  {key}: {value}")
            else:
                output_lines.append(f"  {key}: {value}")
        output_lines.append("")
    
    # Add labeled tables with structured data
    output_lines.append("=== LABELED TABLES ===")
    for table in labeled_tables:
        heading = table.get('heading', 'Unknown')
        table_type = table.get('table_type', 'UNKNOWN')
        data = table.get('structured_data', {})
        
        # Skip empty tables
        if data.get('_empty'):
            continue
        
        output_lines.append(f"\n--- {heading} [{table_type}] ---")
        
        if isinstance(data, dict):
            if 'headers' in data and 'rows' in data:
                # Grid data
                output_lines.append(f"  Headers: {', '.join(data['headers'])}")
                for i, row in enumerate(data.get('rows', [])[:10]):  # Limit rows
                    label = row.pop('_label', f'Row {i+1}')
                    row_str = ', '.join(f"{k}={v}" for k, v in row.items())
                    output_lines.append(f"  {label}: {row_str}")
            elif 'stages' in data:
                # Sleep staging data
                for stage, values in data['stages'].items():
                    output_lines.append(f"  {stage}: {values}")
            else:
                # Key-value data
                for key, value in data.items():
                    if key.startswith('_'):
                        continue
                    if isinstance(value, dict) and 'value' in value:
                        output_lines.append(f"  {key}: {value['value']} {value.get('unit', '')}")
                    else:
                        output_lines.append(f"  {key}: {value}")
    
    return "\n".join(output_lines)


def main():
    """Main function - extracts tables, labels them, and pre-processes for LLM."""
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Please provide a .docx file path"}))
        sys.exit(1)
    
    docx_path = sys.argv[1]
    
    try:
        # Extract raw tables
        raw_tables = extract_tables_from_docx(docx_path)
        
        # Label and structure each table
        labeled_tables = label_and_structure_tables(raw_tables)
        
        # Also get legacy structured data for backwards compatibility
        legacy_structured = structure_tables(raw_tables)
        
        # Format for LLM
        formatted = format_for_llm(labeled_tables, legacy_structured)
        
        result = {
            "success": True,
            "table_count": len(raw_tables),
            "labeled_tables": labeled_tables,
            "structured_data": legacy_structured,
            "formatted_for_llm": formatted,
            "raw_tables": raw_tables
        }
        
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e),
            "table_count": 0,
            "labeled_tables": [],
            "structured_data": {},
            "formatted_for_llm": ""
        }))
        sys.exit(1)


if __name__ == "__main__":
    main()
