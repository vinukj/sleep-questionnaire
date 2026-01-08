

import { fetchQuestionnaireSchema } from './service/questionnaireSchemaService';
import logger from './utils/logger';

// This is kept as a fallback in case the API fails
const defaultQuestionnaireJSON = [
 {
    page: 1,
    title: "Patient Information",
    questions: [
      {
        id: "hospital_id",
        type: "text",
        label: "Hospital ID",
        required: true,
      },
      { id: "name", type: "text", label: "Name", required: true },
      {
        id: "gender",
        type: "radio",
        label: "Gender",
        options: ["M", "F"],
        required: true,
      },
      { id: "age", type: "number", label: "Age", required: true
      
       },
      { id: "occupation", type: "text", label: "Occupation", required: true },
      { id: "phone", type: "tel", label: "Phone Number", required: false },
      { id: "email", type: "email", label: "Email ID", required: false },
    ],
  },
  {
    page: 2,
    title: "Sleep History and Habits",
    questions: [
      {id:"presenting_complaints", type: "text", label: "Presenting Complaints"},
      { id: "bedtime", type: "time", label: "Bedtime", required: false },
      {
        id: "sleep_latency",
        type: "radio",
        label: "Sleep latency/Time taken to fall asleep",
        options: ["< 15 min", "15-30 min", "> 30 min"],
        required: true,
      },
      {
        id: "night_awakenings",
        type: "radio",
        label: "Number of awakenings at night",
        options: ["None", "1-2", ">2 times"],
        required: true,
      },
      {
        id: "avg_sleep_hours",
        type: "number",
        label: "Average hours of sleep",
        required: true,
      },
      {
        id: "shift_worker",
        type: "radio",
        label: "Are you a shift worker?",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "shift_pattern",
        type: "radio",
        label: "If yes, shift pattern",
        options: ["Rotating (day/night)", "Fixed night shift"],
        dependsOn: { id: "shift_worker", value: "Yes" },
        required: true,
      },
    ],
  },
  {
    page: 3,
    title: "Main Sleep Complaints",
    questions: [
      {
        id: "difficulty_initiating",
        type: "radio",
        label: "Difficulty initiating (falling) sleep",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "difficulty_maintaining",
        type: "radio",
        label: "Difficulty maintaining (staying) sleep",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "daytime_sleepiness",
        type: "radio",
        label: "Daytime sleepiness",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "is_snoring",
        type: "radio",
        label: "Do you snore?",
        options: ["Yes", "No"],
        required: true,
      },  
      {
        id: "snoring",
        type: "radio",
        label: "Loud or intrusive snoring for more than 3 nights a week.",
        options: ["Yes", "No"],
        required: true,
        dependsOn: { id: "is_snoring", value: "Yes" },
      },
      {
        id: "witnessed_apneas",
        type: "radio",
        label: "Witnessed apneas",
        options: ["Yes", "No"],
        required: true,
        dependsOn: { id: "is_snoring", value: "Yes" },
      },
      {
        id: "nocturnal_choking",
        type: "radio",
        label: "Nocturnal choking episodes",
        options: ["Yes", "No"],
        required: true,
        dependsOn: { id: "is_snoring", value: "Yes" },
      },
      {
        id: "restless_legs",
        type: "radio",
        label:
          "Restless legs symptoms (Uncomfortable or unpleasant sensation in the legs, more in the evening/night, symptoms relieved on moving around)",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "parasomnias",
        type: "radio",
        label: "Parasomnias",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "parasomnia_details",
        type: "checkbox",
        options: [
          "Sleep walking",
          "Sleep talking",
          "Sleep eating",
          "Nightmares",
        ],
        label: "If yes, specify",
        dependsOn: { id: "parasomnias", value: "Yes" },
        required: false,
      },
      {
        id: "narcolepsy",
        type: "radio",
        label: "Narcolepsy symptoms",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "narcolepsy_details",
        type: "checkbox",
        options: [
          "Sleep attacks",
          "Sleep paralysis",
          { 
            label: "Cataplexy (sudden physical collapse while laughing, crying or in emotional situations)", 
            value: "Cataplexy" 
          },
          "Hallucinations",
        ],
        label: "If yes, specify",
        dependsOn: { id: "narcolepsy", value: "Yes" },
        required: false,
      },
      {
        id: "rem_disorder",
        type: "radio",
        label: "REM Behaviour disorder symptoms (Acting out dreams)",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "bruxism",
        type: "radio",
        label: "Bruxism (grinding teeth in sleep)",
        options: ["Yes", "No"],
        required: true,
      },
    ],
  },
  {
    page: 4,
    title: "Co-morbidities and Medications",
    questions: [
      {
        id: "hypertension",
        type: "radio",
        label: "Hypertension",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "diabetes",
        type: "radio",
        label: "Diabetes",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "ihd",
        type: "radio",
        label: "Ischemic Heart Disease",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "stroke",
        type: "radio",
        label: "Stroke",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "hypothyroidism",
        type: "radio",
        label: "Hypothyroidism",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "neurological_disorder",
        type: "checkbox",
        label: "Neurological disorder",
        options: ["Parkinson’s", "Dementia", "Neuromuscular disease"],
        required: false,
      },
      {
        id: "respiratory_disorder",
        type: "checkbox",
        label: "Chronic Respiratory disorder",
        options: [
          "COPD",
          "Asthma",
          "Interstitial Lung Disease",
          "Bronchiectasis",
        ],
        required: false,
      },
      {
        id: "surgery_sleep_apnea",
        type: "radio",
        label: "Surgery for Sleep Apnea",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id:"surgery_type",
        type :"radio",
        options:[
          "Upper airway surgery",
          "Bariatric surgery",
        ],
        label:"If yes, type of surgery",
        dependsOn:{id:"surgery_sleep_apnea",value:"Yes"}
      },
      {
        id: "medications",
        type: "checkbox",
        label: "Are you taking medications affecting sleep?",
        options: [
          "Sedative-hypnotics",
          "Antidepressants",
          "Antipsychotics",
          "Stimulants",
          "Opioids",
          "Others",
        ],
        required: false,
       
      },
      {
        id: "medications_other",
        type: "text",
        label: "Other (please specify)",
        dependsOn: { id: "medications", value: "Others" },
        required: true,
      },
    ],
  },
  {
    page: 5,
    title: "Clinical Examination",
    questions: [
      { id: "height", type: "number", label: "Height (cm)", required: true },
      { id: "weight", type: "number", label: "Weight (kg)", required: true },
      {
        id: "bmi",
        type: "number",
        label: "BMI (kg/sq.m)",
        calculated: true,
        dependsOn: ["height", "weight"],
        formula: "weight / ((height/100) * (height/100))",
        required: true,
      },
      {
        id: "waist",
        type: "number",
        label: "Waist circumference (cm)",
        required: true,
      },
      {
        id: "hip",
        type: "number",
        label: "Hip circumference (cm)",
        required: true,
      },
      {
        id: "waist_hip_ratio",
        type: "number",
        label: "Waist/Hip ratio",
        calculated: true,
        dependsOn: ["waist", "hip"],
        formula: "waist / hip",
        required: true,
      },
      {
        id: "neck",
        type: "number",
        label: "Neck circumference (cm)",
        required: true,
      },
      { id: "bp", type: "text", label: "Blood Pressure", required: true },
      { id: "spo2", type: "number", label: "SpO2", required: true },
      {
        id: "mallampati",
        type: "radio",
        label: "Mallampati Grade",
        options: ["1", "2", "3", "4"],
        required: true,
      },
    ],
  },
  {
    page: 6,
    title: "Sleepiness Scales",
    questions: [
      {
        id: "epworth_score",
        type: "number",
        label: "Epworth Sleepiness Scale Score",
        required: true,
      },
      {
        id: "iss_q1",
        type: "radio",
        label: "On waking, do you feel drowsy/unrefreshing sleep?",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "iss_q2a",
        type: "radio",
        label: "Do you snore?",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "iss_q2b",
        type: "radio",
        label:
          "If yes, has your bed partner noticed that you stop breathing while snoring?",
        options: ["Yes", "No"],
        dependsOn: { id: "iss_q2a", value: "Yes" },
        required: true,
      },
      {
        id: "iss_q3",
        type: "radio",
        label: "Do your knees buckle/give way while laughing/crying or in intense emotional situations?",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "iss_q4",
        type: "radio",
        label: "Do you kick your bed partner/bed sheets away in sleep?",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "iss_q5",
        type: "radio",
        label: "Do you feel drowsy while watching TV or leisure activities?",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "iss_q6",
        type: "radio",
        label: "Do you feel drowsy / sleepy while doing household work?",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "iss_q7",
        type: "radio",
        label: "Have you ever experienced sleep attacks?",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "iss_q8a",
        type: "radio",
        label: "Nodded off / Felt sleepy while conversing?",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "iss_q8b",
        type: "radio",
        label: "Nodded off / Felt sleepy while driving?",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "iss_q8c",
        type: "radio",
        label: "Nodded off / Felt sleepy while cooking?",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "iss_q8d",
        type: "radio",
        label: "Nodded off / Felt sleepy while doing office work?",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "iss_q8e",
        type: "radio",
        label: "Nodded off / Felt sleepy while operating heavy machinery?",
        options: ["Yes", "No"],
        required: true,
      },
    ],
  },
  {
    page: 7,
    title: "Clinical Impression & Work-up",
    questions: [
      {
        id: "clinical_impression",
        type: "checkbox",
        label: "Clinical Impression",
        options: [
          "Poor Sleep Hygiene",
          "Obstructive Sleep Apnea",
          "Obesity Hypoventilation Syndrome",
          "Insomnia",
          "Restless Legs Syndrome",
          "Parasomnia",
          "RBD",
          "Narcolepsy",
          "Circadian Rhythm Sleep Disorder",
          "Shift Work Sleep Disorder",
          "Others",
        ],
        required: false,
      },
      {
        id: "clinical_impression_other",
        type: "text",
        label: "Other (please specify)",
        dependsOn: { id: "clinical_impression", value: "Others" },
        required: true,
      },
      {
        id: "recommended_workup",
        type: "checkbox",
        label: "Recommended work-up",
        options: [
          "Level 1 Polysomnography",
          "Level 2 Polysomnography",
          "Level 3 Polysomnography",
          "Split night polysomnography",
          "Multiple Sleep Latency Test",
          "PAP titration study",
        ],
        required: false,
      },
    ],
  },
];

let questionnaire = null;

export const loadQuestionnaire = async () => {
  if (questionnaire) return questionnaire;

  try {
    // Try to fetch from API
    const data = await fetchQuestionnaireSchema();
    questionnaire = data;
  } catch (error) {
    logger.warn('Failed to fetch questionnaire from API, using default:', error);
    // Fall back to default if API fails
    questionnaire = defaultQuestionnaireJSON.map(page => ({
      ...page,
      questions: page.questions.map(question => {
        if (question.id === 'neurological_disorder' || question.id === 'respiratory_disorder'|| question.id === 'medications'|| question.id === 'email') {
          return {
            ...question,
            required: false
          };
        }
        return question;
      })
    }));
  }
  return questionnaire;
};

// For backward compatibility
export const STJohnQuestionnaire = defaultQuestionnaireJSON.map(page => ({
  ...page,
  questions: page.questions.map(question => {
    if (question.id === 'neurological_disorder' || question.id === 'respiratory_disorder'|| question.id === 'medications'|| question.id === 'email') {
      return {
        ...question,
        required: false
      };
    }
    return question;
  })
}));