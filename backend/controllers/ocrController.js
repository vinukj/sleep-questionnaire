import fs from 'fs';
import path from 'path';
import { extractTextFromFile, getSupportedFormats } from '../services/ocrService.js';
import { extractAndRedactPII, formatPIIData } from '../services/piiExtractionService.js';
import { extractMedicalData, isCerebrasConfigured } from '../services/cerebrasService.js';

/**
 * Process OCR on an uploaded file (PDF, DOCX, DOC, or Image)
 * Extracts text from documents using OCR and text extraction
 * Also extracts and redacts PII (Personal Identifiable Information)
 * Optionally sends to LLM for structured data extraction
 */
export const processFileOCR = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { filename, path: filePath, mimetype } = req.file;
    const fileExt = path.extname(filename).toLowerCase();

    console.log(`Processing OCR request for file: ${filename} (${mimetype})`);

    // Extract text using the OCR service
    const extractedText = await extractTextFromFile(filePath, mimetype);

    // Extract and redact PII from the text
    console.log('\n📋 Extracting PII (Personal Identifiable Information)...');
    const piiResult = extractAndRedactPII(extractedText);

    // Log PII extraction results
    console.log('\n' + '='.repeat(60));
    console.log('PII EXTRACTION RESULTS');
    console.log('='.repeat(60));
    piiResult.log.forEach(logEntry => console.log(logEntry));
    console.log('='.repeat(60) + '\n');

    // Check if LLM extraction is requested and configured
    const useLLM = req.query.useLLM === 'true' || req.body.useLLM === true;
    let llmResult = null;

    if (useLLM && isCerebrasConfigured()) {
      console.log('🤖 LLM extraction requested and Cerebras is configured');
      llmResult = await extractMedicalData(piiResult.redactedText);
    } else if (useLLM && !isCerebrasConfigured()) {
      console.warn('⚠️  LLM extraction requested but Cerebras API key not configured');
    }

    // Clean up uploaded file
    fs.unlink(filePath, (err) => {
      if (err) console.error('Failed to delete temp file:', err);
    });

    // Calculate statistics for both original and redacted text
    const originalWordCount = extractedText.split(/\s+/).filter((word) => word.length > 0).length;
    const originalLineCount = extractedText.split('\n').length;
    
    const redactedWordCount = piiResult.redactedText.split(/\s+/).filter((word) => word.length > 0).length;
    const redactedLineCount = piiResult.redactedText.split('\n').length;

    // Build response object
    const response = {
      success: true,
      fileName: filename,
      fileType: mimetype,
      extractedText: piiResult.redactedText,
      originalText: extractedText,
      pii: formatPIIData(piiResult.pii),
      piiExtractionLog: piiResult.log,
      statistics: {
        original: {
          textLength: extractedText.length,
          wordCount: originalWordCount,
          lineCount: originalLineCount,
        },
        redacted: {
          textLength: piiResult.redactedText.length,
          wordCount: redactedWordCount,
          lineCount: redactedLineCount,
        },
        redactionCount: piiResult.redactionCount,
      },
    };

    // Add LLM results if available
    if (llmResult) {
      response.llm = {
        enabled: true,
        success: llmResult.success,
        medicalData: llmResult.extractedData,
        model: llmResult.model,
        tokensUsed: llmResult.tokensUsed,
        error: llmResult.error || null,
      };
      // Also add medical data at top level for easier access
      response.medicalData = llmResult.extractedData;
    } else if (useLLM) {
      response.llm = {
        enabled: false,
        reason: 'Cerebras API key not configured',
      };
    }

    // Return extracted text with PII information and medical data
    res.json(response);
  } catch (error) {
    console.error('OCR Error:', error);

    // Clean up file if it exists
    if (req.file?.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Failed to delete temp file:', err);
      });
    }

    res.status(500).json({
      error: 'Failed to process file',
      details: error.message,
    });
  }
};

/**
 * Health check endpoint for OCR service
 */
export const ocrHealthCheck = (req, res) => {
  const supportedFormats = getSupportedFormats();
  
  res.json({
    status: 'healthy',
    message: 'OCR service is running',
    supportedFormats: supportedFormats,
    version: '2.0.0',
  });
};
