/**
 * Cerebras LLM Service
 * Integrates with Cerebras API for text analysis and data extraction
 */

import dotenv from 'dotenv';
dotenv.config();

const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY;
const CEREBRAS_API_URL = 'https://api.cerebras.ai/v1/chat/completions';
const DEFAULT_MODEL = 'llama3.1-8b'; // Fast and efficient model

/**
 * Send a request to Cerebras API
 * @param {string} prompt - The prompt to send
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - API response
 */
async function callCerebrasAPI(prompt, options = {}) {
  if (!CEREBRAS_API_KEY) {
    throw new Error('CEREBRAS_API_KEY not found in environment variables');
  }

  const {
    model = DEFAULT_MODEL,
    temperature = 0.1,
    maxTokens = 2000,
    systemPrompt = 'You are a helpful AI assistant that extracts structured data from medical documents.',
  } = options;

  const messages = [
    {
      role: 'system',
      content: systemPrompt,
    },
    {
      role: 'user',
      content: prompt,
    },
  ];

  try {
    const response = await fetch(CEREBRAS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CEREBRAS_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Cerebras API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Cerebras API call failed:', error.message);
    throw error;
  }
}

/**
 * Extract structured medical data from polysomnography report
 * @param {string} text - The OCR text (redacted)
 * @returns {Promise<Object>} - Extracted medical data
 */
export async function extractMedicalData(text) {
  console.log('🤖 Sending text to Cerebras LLM for data extraction...');
  
  const systemPrompt = `You are a medical data extraction specialist. Extract structured information from polysomnography (sleep study) reports.
Return ONLY valid JSON with no additional text or explanation. Extract all numeric values as numbers, not strings.`;

  const prompt = `
You are a medical data extraction assistant specialized in SOMNOMEDICS polysomnography reports.

Extract ALL the fields listed below from the report text and return a SINGLE valid JSON object.
If a value is not explicitly present in the report, use null.
DO NOT guess, calculate, or infer values unless explicitly instructed.

IMPORTANT GLOBAL RULES:
1. CRITICAL:
- Extract values ONLY from the DIAGNOSTIC column.
- IGNORE CPAP / titration columns for ALL fields except the TITRATION section.
- If a value exists only in CPAP/titration, return null.

2. Recording Device Detection:
- If report mentions "Alice" or "Alice 6 LDx", set recordingDevice to "Alice 6 LDx"
- If report mentions "SOMNOmedics" or "Somnomedics", set recordingDevice to "SOMNOmedics"
- Extract the exact device name as it appears in the report

3. Many Somnomedics values appear as: count (index). You MUST extract BOTH.
4. All indices in parentheses are per-hour indices.
5. Use numeric values (not strings) for numbers.
6. Use null if a field is missing or marked as "-" in the report.
7. Do NOT mix Diagnostic and CPAP columns.
8. Do NOT average or recompute any values.
9. Times are in minutes unless explicitly HH:MM:SS.

========================
PATIENT / HEADER
========================
Extract exactly as written.

Recording Device:
- recordingDevice (e.g., "Alice 6 LDx" for Alice reports, "SOMNOmedics" for Somnomedics reports)

Patient Information:
- firstName
- lastName
- patientId (ID / OP-IP number)
- measurementDate (Somnomedics "Measurement date" or Study date, format YYYY-MM-DD)
- comments (header comments, if present)

Physical details:
- sex (M/F)
- height (cm)
- weight (kg)
- bmi
- dateOfBirth (YYYY-MM-DD)
- age (CALCULATE from dateOfBirth and measurementDate ONLY if both are present, else null)

========================
CLINICAL INFORMATION
========================
- indications (complaints / indications)
- ess (Epworth Sleepiness Scale)
- iss (Insomnia Severity Scale)
- comorbidities
- diagnosis (impression)
- clinicalComments (narrative comments, if present)
- advice

========================
STUDY TIMING (DIAGNOSTIC)
========================
- lightsOffTime (HH:MM:SS)
- lightsOnTime (HH:MM:SS)
- totalRecordingTime (minutes)
- totalSleepTime (minutes)
- sleepEfficiency (percentage)
- sleepLatency (minutes)
- waso (minutes)
- wakePercent (Wake % of sleep time)

========================
REM LATENCY
========================
Somnomedics reports two REM latencies.
If a single REM latency is requested elsewhere, always use "from sleep onset".


- remLatencyFromSleepOnset (minutes)
- remLatencyFromLightsOff (minutes)

If one is missing, set it to null.

========================
SLEEP STAGING (DIAGNOSTIC – minutes ONLY)
========================
Extract durations in minutes, NOT percentages.
Sleep staging rules:
- Extract DURATIONS in MINUTES only.
- Ignore percentages.
- Ignore latency values.
- Do NOT use values with a % symbol.
- If minutes are not explicitly shown, return null.


- n1
- n2
- n3
- rem

========================
RESPIRATORY EVENTS – COUNTS AND INDICES
========================

Respiratory counts:
- If an event count is shown as 0, return 0 (not null).
- Use null ONLY if the event is not listed at all.

Each event MUST be extracted as an object with:
{ "count": number, "index": number }

- centralApnea
- obstructiveApnea
- mixedApnea
- totalApnea
- hypopnea
- apneaHypopnea
- rera
- rdi

========================
STATE-SPECIFIC INDICES
========================
CRITICAL: Extract these ONLY if explicitly labeled as "REM RDI" or "NREM RDI" in the report.
Do NOT extract regular RDI values into these fields.
If not explicitly present, return null.

- remRdi (extract ONLY if labeled as "REM RDI", "RDI REM", or similar)
- nremRdi (extract ONLY if labeled as "NREM RDI", "RDI NREM", or similar)

========================
POSITIONAL INDICES
========================
Extract ONLY if explicitly provided.

- supineAhi
- supineRdi

========================
AROUSALS
========================
- arousalsTotal (Ar + Aw total)
- arousalIndex

========================
OXYGENATION
========================
- minimumSpO2
- meanSpO2

Hypoxic Burden:
- hypoxicBurden (extract ONLY if explicitly labeled as “HB” or “Hypoxic Burden”, else null)

========================
CARDIAC (DIAGNOSTIC)
========================
- heartRateAverage
- heartRateHighest
- heartRateLowest

========================
TITRATION (LAST PAGE ONLY – IF PRESENT)
========================
Extract ONLY if titration information exists.

Pressure values MUST include units exactly as written (e.g., "10 cm H2O").


- titrationQuality (Optimal / Good / Adequate / Inadequate)
- pressureSetting (cm H2O, include unit)
- maskInterface (Nasal / Oronasal)
- deviceType (CPAP / BPAP / APAP / ASV)
- maskSize (S / M / L)

========================
OUTPUT FORMAT
========================
Return ONLY a valid JSON object with this structure.
Do NOT include explanations or extra text.

Before returning JSON:
- Verify that sleep stage durations sum approximately to totalSleepTime.
- Verify that apnea + hypopnea counts equal A+H total if all are present.
- If inconsistencies exist, do NOT correct them — return values as shown.


REPORT TEXT:
${text}
`;


  try {
    const response = await callCerebrasAPI(prompt, {
      systemPrompt,
      temperature: 0.1,
      maxTokens: 1500,
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response content from Cerebras API');
    }

    // Parse the JSON response
    let extractedData;
    try {
      // Try to find JSON in the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        extractedData = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Failed to parse LLM response as JSON:', content);
      throw new Error('LLM response was not valid JSON');
    }

    console.log('✅ Successfully extracted medical data from LLM');
    
    return {
      success: true,
      extractedData,
      model: response.model || DEFAULT_MODEL,
      tokensUsed: {
        prompt: response.usage?.prompt_tokens || 0,
        completion: response.usage?.completion_tokens || 0,
        total: response.usage?.total_tokens || 0,
      },
    };
  } catch (error) {
    console.error('Medical data extraction failed:', error.message);
    return {
      success: false,
      error: error.message,
      extractedData: null,
    };
  }
}

/**
 * General text analysis using Cerebras LLM
 * @param {string} text - The text to analyze
 * @param {string} instruction - What to extract or analyze
 * @returns {Promise<Object>} - Analysis result
 */
export async function analyzeText(text, instruction, options = {}) {
  console.log('🤖 Analyzing text with Cerebras LLM...');
  
  const prompt = `${instruction}\n\nText:\n${text}`;
  
  try {
    const response = await callCerebrasAPI(prompt, {
      temperature: options.temperature || 0.2,
      maxTokens: options.maxTokens || 2000,
      systemPrompt: options.systemPrompt || 'You are a helpful AI assistant.',
    });

    const content = response.choices[0]?.message?.content;
    
    return {
      success: true,
      result: content,
      model: response.model || DEFAULT_MODEL,
      tokensUsed: {
        prompt: response.usage?.prompt_tokens || 0,
        completion: response.usage?.completion_tokens || 0,
        total: response.usage?.total_tokens || 0,
      },
    };
  } catch (error) {
    console.error('Text analysis failed:', error.message);
    return {
      success: false,
      error: error.message,
      result: null,
    };
  }
}

/**
 * Summarize medical report
 * @param {string} text - The report text
 * @returns {Promise<Object>} - Summary
 */
export async function summarizeReport(text) {
  console.log('🤖 Generating report summary with Cerebras LLM...');
  
  const systemPrompt = 'You are a medical professional who creates clear, concise summaries of sleep study reports.';
  
  const prompt = `Provide a concise 3-4 sentence summary of this polysomnography report, highlighting the key findings, diagnosis, and severity:

${text}`;

  try {
    const response = await callCerebrasAPI(prompt, {
      systemPrompt,
      temperature: 0.3,
      maxTokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    
    return {
      success: true,
      summary: content,
      model: response.model || DEFAULT_MODEL,
      tokensUsed: {
        prompt: response.usage?.prompt_tokens || 0,
        completion: response.usage?.completion_tokens || 0,
        total: response.usage?.total_tokens || 0,
      },
    };
  } catch (error) {
    console.error('Report summarization failed:', error.message);
    return {
      success: false,
      error: error.message,
      summary: null,
    };
  }
}

/**
 * Check if Cerebras API is configured
 * @returns {boolean}
 */
export function isCerebrasConfigured() {
  return !!CEREBRAS_API_KEY;
}

export default {
  extractMedicalData,
  analyzeText,
  summarizeReport,
  isCerebrasConfigured,
};
