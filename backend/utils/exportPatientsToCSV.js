import { parse } from 'json2csv';

/**
 * Flattens a single patient response JSON
 * @param {Object} patientData - JSON for one patient
 * @returns {Object} flattened object suitable for CSV
 */
const flattenPatientResponse = (patientData) => {
  const flat = { patientId: patientData.patientId };
  
  if (!patientData.responses) return flat;

  for (const pageKey in patientData.responses) {
    const page = patientData.responses[pageKey];
    for (const questionKey in page) {
      flat[`${pageKey}_${questionKey}`] = page[questionKey];
    }
  }

  return flat;
};

/**
 * Converts array of patient JSON responses to CSV
 * @param {Array} patientResponses - Array of patient JSON objects
 * @returns {String} CSV string
 */
const exportPatientsToCSV = (patientResponses) => {
  const flattenedData = patientResponses.map(flattenPatientResponse);
  return parse(flattenedData);
};

// --------------------- Example Usage ---------------------
const patients = [
  {
    patientId: "H12345",
    responses: {
      page1: { hospital_id: "H12345", name: "John Doe", gender: "M", age: 42 },
      page2: { bedtime: "22:30", sleep_latency: "<15 min", night_awakenings: "1-2" },
      page3: { difficulty_initiating: "Y", daytime_sleepiness: "Y" }
    }
  },
  {
    patientId: "H12346",
    responses: {
      page1: { hospital_id: "H12346", name: "Jane Smith", gender: "F", age: 35 },
      page2: { bedtime: "23:00", sleep_latency: "15-30 min", night_awakenings: "None" },
      page3: { difficulty_initiating: "N", daytime_sleepiness: "N" }
    }
  }
];

const csvOutput = exportPatientsToCSV(patients);
console.log(csvOutput);
