export const STJohnQuestionnaire = [
  {
    page: 1,
    title: "Patient Information",
    questions: [
      { id: "hospital_id", type: "text", label: "Hospital ID" },
      { id: "name", type: "text", label: "Name" },
      { id: "gender", type: "radio", label: "Gender", options: ["M", "F"] },
      { id: "age", type: "number", label: "Age" },
      { id: "occupation", type: "text", label: "Occupation" },
      { id: "phone", type: "tel", label: "Phone Number" },
      { id: "email", type: "email", label: "Email ID" },
    ],
  },
  {
    page: 2,
    title: "Sleep Habits",
    questions: [
      { id: "bedtime", type: "time", label: "Bedtime" },
      {
        id: "sleep_latency",
        type: "radio",
        label: "Sleep latency/Time taken to fall asleep",
        options: ["< 15 min", "15-30 min", "> 30 min"],
      },
      {
        id: "night_awakenings",
        type: "radio",
        label: "Number of awakenings at night",
        options: ["None", "1-2", ">2 times"],
      },
      {
        id: "avg_sleep_hours",
        type: "number",
        label: "Average hours of sleep",
      },
      {
        id: "shift_worker",
        type: "radio",
        label: "Are you a shift worker?",
        options: ["Yes", "No"],
      },
      {
        id: "shift_pattern",
        type: "radio",
        label: "If yes, shift pattern",
        options: ["Rotating (day/night)", "Fixed night shift"],
        dependsOn: { "id": "shift_worker", "value": "Yes" }
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
      },
      {
        id: "difficulty_maintaining",
        type: "radio",
        label: "Difficulty maintaining (staying) sleep",
        options: ["Yes", "No"],
      },
      {
        id: "daytime_sleepiness",
        type: "radio",
        label: "Daytime sleepiness",
        options: ["Yes", "No"],
      },
      { id: "snoring", type: "radio", label: "Snoring", options: ["Yes", "No"] },
      {
        id: "witnessed_apneas",
        type: "radio",
        label: "Witnessed apneas",
        options: ["Yes", "No"],
      },
      {
        id: "nocturnal_choking",
        type: "radio",
        label: "Nocturnal choking episodes",
        options: ["Yes", "No"],
      },
      {
        id: "restless_legs",
        type: "radio",
        label: "Restless legs symptoms/Uncomfortable or unpleasant sensation in the legs",
        options: ["Yes", "No"],
        required: false
      },
      {
        id: "parasomnias",
        type: "radio",
        label: "Parasomnias/Sleep walking/Sleep talking/Sleep eating/Nightmares",
        options: ["Yes", "No"],
        required: false
      },
      {
        id: "narcolepsy",
        type: "radio",
        label: "Narcolepsy symptoms/Sleep attacks/Sleep paralysis/Cataplexy/Hallucinations",
        options: ["Yes", "No"],
        required: false
      },
      {
        id: "rem_disorder",
        type: "radio",
        label: "REM Behaviour disorder symptoms / Acting out dreams",
        options: ["Yes", "No"],
        required: false
      },
      {
        id: "bruxism",
        type: "radio",
        label: "Bruxism (grinding teeth in sleep)",
        options: ["Yes", "No"],
        required: false
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
      },
      {
        id: "diabetes",
        type: "radio",
        label: "Diabetes",
        options: ["Yes", "No"],
      },
      {
        id: "ihd",
        type: "radio",
        label: "Ischemic Heart Disease",
        options: ["Yes", "No"],
      },
      { id: "stroke", type: "radio", label: "Stroke", options: ["Yes", "No"] },
      {
        id: "hypothyroidism",
        type: "radio",
        label: "Hypothyroidism",
        options: ["Yes", "No"],
      },
      {
        id: "neurological_disorder",
        type: "checkbox",
        label: "Neurological disorder",
        options: ["Parkinson’s", "Dementia", "Neuromuscular disease"],
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
      },
      {
        id: "surgery_sleep_apnea",
        type: "radio",
        label: "Surgery for Sleep Apnea",
        options: ["Yes", "No"],
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
          "Others"
        ],
        otherOption: {
          option: "Others",
          textField: true
        },
      },
    ],
  },
  {
    page: 5,
    title: "Clinical Examination",
    questions: [
      { id: "height", type: "number", label: "Height (cm)" },
      { id: "weight", type: "number", label: "Weight (kg)" },
      { 
        id: "bmi", 
        type: "number", 
        label: "BMI (kg/sq.m)", 
        calculated: true,
        dependsOn: ["height", "weight"],
        formula: "weight / ((height/100) * (height/100))"
      },
      { id: "waist", type: "number", label: "Waist circumference (cm)" },
      { id: "hip", type: "number", label: "Hip circumference (cm)" },
      { 
        id: "waist_hip_ratio", 
        type: "number", 
        label: "Waist/Hip ratio",
        calculated: true,
        dependsOn: ["waist", "hip"],
        formula: "waist / hip"
      },
      { id: "neck", type: "number", label: "Neck circumference (cm)" },
      { id: "bp", type: "text", label: "Blood Pressure" },
      { id: "spo2", type: "number", label: "SpO2" },
      {
        id: "mallampati",
        type: "radio",
        label: "Mallampati Grade",
        options: ["1", "2", "3", "4"],
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
      },
      {
        id: "iss_q1",
        type: "radio",
        label: "On waking, do you feel drowsy/unrefreshing sleep?",
        options: ["Yes", "No"],
      },
      {
        id: "iss_q2a",
        type: "radio",
        label: "Do you snore?",
        options: ["Yes", "No"],
      },
      {
        id: "iss_q2b",
        type: "radio",
        label: "If yes, stop breathing while snoring?",
        options: ["Yes", "No"],
        dependsOn: { "id": "iss", "value": "Yes" }
      },
      {
        id: "iss_q3",
        type: "radio",
        label: "Do your knees give way during emotional situations?",
        options: ["Yes", "No"],
      },
      {
        id: "iss_q4",
        type: "radio",
        label: "Do you kick your bed partner/bed sheets away in sleep?",
        options: ["Yes", "No"],
      },
      {
        id: "iss_q5",
        type: "radio",
        label: "Do you feel drowsy while watching TV or leisure activities?",
        options: ["Yes", "No"],
      },
      {
        id: "iss_q6",
        type: "radio",
        label: "Do you feel drowsy / sleepy  while doing household work?",
        options: ["Yes", "No"],
      },
      {
        id: "iss_q7",
        type: "radio",
        label: "Have you ever experienced sleep attacks?",
        options: ["Yes", "No"],
      },
      {
        id: "iss_q8a",
        type: "radio",
        label: "Nodded off / Felt sleepy while conversing?",
        options: ["Yes", "No"],
      },
      {
        id: "iss_q8b",
        type: "radio",
        label: "Nodded off / Felt sleepy  while driving?",
        options: ["Yes", "No"],
      },
      {
        id: "iss_q8c",
        type: "radio",
        label: "Nodded off / Felt sleepy while cooking?",
        options: ["Yes", "No"],
      },
      {
        id: "iss_q8d",
        type: "radio",
        label: "Nodded off / Felt sleepy  while office work?",
        options: ["Yes", "No"],
      },
      {
        id: "iss_q8e",
        type: "radio",
        label: "Nodded off / Felt sleepy  while operating heavy machinery?",
        options: ["Yes", "No"],
      },
      // { id: "iss_total_score", type: "number", label: "Total ISS Score" },
    ],
  },
  {
    page: 7,
    title: "Clinical Impression & Work-up",
    questions: [
      {
        id: "clinical_impression",
        type: "textarea",
        label: "Clinical Impression (500 chars)",
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
      },
    ],
  },
  // {
  //   page: 8,
  //   title: "Follow-up Data",
  //   questions: [
  //     { id: "followup_date", type: "date", label: "Date of visit" },
  //     {
  //       id: "pap_mode",
  //       type: "dropdown",
  //       label: "Mode of PAP",
  //       options: ["CPAP", "APAP", "BPAP", "ASV"],
  //     },
  //     {
  //       id: "mask_type",
  //       type: "dropdown",
  //       label: "Mask type",
  //       options: ["Nasal", "Oronasal", "Pillows", "Hybrid"],
  //     },
  //     {
  //       id: "mask_fit",
  //       type: "dropdown",
  //       label: "Mask fit",
  //       options: ["Good", "Poor"],
  //     },
  //     { id: "leak", type: "number", label: "Leak (L/min)" },
  //     {
  //       id: "cpap_days",
  //       type: "number",
  //       label: "Duration of CPAP usage (days)",
  //     },
  //     {
  //       id: "avg_duration",
  //       type: "text",
  //       label: "Average duration/night (hrs:min)",
  //     },
  //     { id: "residual_ahi", type: "number", label: "Residual AHI" },
  //     { id: "p90_p95", type: "number", label: "P90 or P95" },
  //     { id: "ess_score", type: "number", label: "ESS score" },
  //     { id: "iss_score", type: "number", label: "ISS score" },
  //     {
  //       id: "pap_complications",
  //       type: "textarea",
  //       label: "Complications of PAP therapy (1000 chars)",
  //     },
  //   ],
  // },
];
