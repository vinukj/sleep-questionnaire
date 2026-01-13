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
  IMPORTANT:
- Extract values ONLY from the DIAGNOSTIC portion of the report.
- Ignore CPAP, titration, or treatment sections unless a field is explicitly under "TITRATION".
- If multiple values exist for the same field, use the diagnostic value and ignore others.

  Extract the following fields from the provided polysomnography report tables.
Return ONE valid JSON object.
Use null if a field is not explicitly present.
Use numbers for numeric values.

========================
PATIENT / HEADER
========================
- recordingDevice
- firstName
- lastName
- patientId
- measurementDate
- comments
- sex
- height
- weight
- bmi
- dateOfBirth
- age

========================
CLINICAL INFORMATION
========================
- indications
- ess
- iss
- comorbidities
- diagnosis
- clinicalComments
- advice

========================
STUDY TIMING (DIAGNOSTIC)
========================
- lightsOffTime
- lightsOnTime
- totalRecordingTime
- totalSleepTime
- sleepEfficiency
- sleepLatency
- waso
- wakePercent

========================
REM LATENCY
========================
- remLatencyFromSleepOnset
- remLatencyFromLightsOff

========================
SLEEP STAGING (MINUTES)
========================
- n1
- n2
- n3
- rem

========================
RESPIRATORY EVENTS
(each as { count, index })
========================
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
- remRdi
- nremRdi

========================
POSITIONAL INDICES
========================
- supineAhi
- supineRdi

========================
AROUSALS
========================
- arousalsTotal
- arousalIndex

========================
OXYGENATION
========================
- minimumSpO2
- meanSpO2
- hypoxicBurden

========================
CARDIAC
========================
- heartRateAverage
- heartRateHighest
- heartRateLowest

========================
TITRATION (IF PRESENT)
========================
- titrationQuality
- pressureSetting
- maskInterface
- deviceType
- maskSize

========================
INPUT
========================
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
