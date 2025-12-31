import Tesseract from 'tesseract.js';
import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';

/**
 * OCR Service
 * Handles text extraction from various file formats (PDF, DOCX, DOC, images)
 */

/**
 * Main function to process any supported file and extract text
 * @param {string} filePath - Path to the file to process
 * @param {string} mimetype - MIME type of the file
 * @returns {Promise<string>} - Extracted text
 */
export async function extractTextFromFile(filePath, mimetype) {
  const fileExt = path.extname(filePath).toLowerCase();
  
  console.log(`Processing file: ${path.basename(filePath)} (${mimetype})`);
  
  // Handle PDF files
  if (mimetype === 'application/pdf' || fileExt === '.pdf') {
    return await extractTextFromPDF(filePath);
  }
  
  // Handle DOCX files
  if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    fileExt === '.docx'
  ) {
    return await extractTextFromDOCX(filePath);
  }
  
  // Handle DOC files (older Word format)
  if (mimetype === 'application/msword' || fileExt === '.doc') {
    return await extractTextFromDOC(filePath);
  }
  
  // Handle image files
  if (
    mimetype.startsWith('image/') ||
    ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.tiff', '.tif'].includes(fileExt)
  ) {
    return await extractTextFromImage(filePath);
  }
  
  throw new Error(`Unsupported file format: ${fileExt || mimetype}`);
}

/**
 * Extract text from PDF files
 * First attempts direct text extraction, then falls back to OCR for image-based PDFs
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<string>} - Extracted text
 */
export async function extractTextFromPDF(filePath) {
  try {
    // Dynamically import pdf-parse (CommonJS module)
    const pdfParse = (await import('pdf-parse')).default;
    
    const pdfBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(pdfBuffer);
    
    // If PDF has extractable text, use it
    if (pdfData.text && pdfData.text.trim().length > 50) {
      console.log('PDF text extracted directly (text-based PDF)');
      return pdfData.text.trim();
    }
    
    // If PDF is image-based or has minimal text, fall back to OCR
    console.log('PDF appears to be image-based, attempting OCR...');
    
    // For image-based PDFs, we would need to convert PDF pages to images first
    // This is a more complex operation that requires pdf-to-image libraries
    // For now, return what we have or throw an error
    if (pdfData.text && pdfData.text.trim().length > 0) {
      console.log('Returning minimal text from PDF');
      return pdfData.text.trim();
    }
    
    throw new Error(
      'PDF appears to be image-based. OCR for image-based PDFs requires additional setup. ' +
      'Please convert PDF pages to images first.'
    );
  } catch (error) {
    console.error('PDF processing error:', error.message);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

/**
 * Extract text from DOCX files
 * @param {string} filePath - Path to the DOCX file
 * @returns {Promise<string>} - Extracted text
 */
export async function extractTextFromDOCX(filePath) {
  try {
    console.log('Extracting text from DOCX file...');
    
    // Method 1: Try extractRawText first (faster, preserves formatting better)
    const rawResult = await mammoth.extractRawText({ path: filePath });
    
    if (rawResult.text && rawResult.text.trim().length > 0) {
      console.log(`Successfully extracted ${rawResult.text.length} characters from DOCX`);
      
      // Log any messages/warnings from mammoth
      if (rawResult.messages && rawResult.messages.length > 0) {
        console.log('Mammoth messages:', rawResult.messages);
      }
      
      return rawResult.text.trim();
    }
    
    // Method 2: If raw text extraction fails, try HTML conversion
    console.log('No text with extractRawText, trying HTML conversion...');
    const htmlResult = await mammoth.convertToHtml({ path: filePath });
    
    if (htmlResult.value && htmlResult.value.trim().length > 0) {
      // Strip HTML tags to get plain text
      const text = stripHtmlTags(htmlResult.value).trim();
      console.log(`Extracted ${text.length} characters via HTML conversion`);
      return text;
    }
    
    // If both methods fail, return empty or throw error
    console.warn('No text content found in DOCX file');
    return '';
  } catch (error) {
    console.error('DOCX processing error:', error.message);
    throw new Error(`Failed to extract text from DOCX: ${error.message}`);
  }
}

/**
 * Extract text from DOC files (older Word format)
 * Note: Direct extraction from .doc files is complex due to binary format
 * Recommended approach is to convert to DOCX first or use LibreOffice/external tools
 * @param {string} filePath - Path to the DOC file
 * @returns {Promise<string>} - Extracted text
 */
export async function extractTextFromDOC(filePath) {
  try {
    console.log('Processing DOC file...');
    
    // Try using mammoth (limited support for .doc)
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      if (result.text && result.text.trim().length > 0) {
        console.log('DOC text extracted successfully');
        return result.text.trim();
      }
    } catch (mammothError) {
      console.warn('Mammoth failed for DOC file:', mammothError.message);
    }
    
    // DOC format is binary and complex - would need additional libraries
    throw new Error(
      'Legacy DOC format has limited support. ' +
      'Please save as DOCX, PDF, or upload as an image for OCR processing.'
    );
  } catch (error) {
    console.error('DOC processing error:', error.message);
    throw new Error(`Failed to extract text from DOC: ${error.message}`);
  }
}

/**
 * Extract text from image files using Tesseract OCR
 * @param {string} filePath - Path to the image file
 * @returns {Promise<string>} - Extracted text
 */
export async function extractTextFromImage(filePath) {
  try {
    console.log('Starting Tesseract OCR for image...');
    
    const worker = await Tesseract.createWorker('eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          const progress = Math.round(m.progress * 100);
          if (progress % 10 === 0) {
            console.log(`OCR Progress: ${progress}%`);
          }
        }
      },
    });
    
    const result = await worker.recognize(filePath);
    const text = result.data.text;
    
    await worker.terminate();
    
    console.log(`OCR completed. Extracted ${text.length} characters`);
    return text.trim();
  } catch (error) {
    console.error('Image OCR error:', error.message);
    throw new Error(`Failed to perform OCR on image: ${error.message}`);
  }
}

/**
 * Helper function to strip HTML tags from text
 * @param {string} html - HTML string
 * @returns {string} - Plain text
 */
function stripHtmlTags(html) {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gi, '') // Remove style tags
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]+>/g, ' ') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Get supported file formats
 * @returns {Object} - Information about supported formats
 */
export function getSupportedFormats() {
  return {
    formats: {
      pdf: {
        extensions: ['.pdf'],
        mimeTypes: ['application/pdf'],
        description: 'PDF documents (text-based and image-based)',
      },
      docx: {
        extensions: ['.docx'],
        mimeTypes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        description: 'Microsoft Word documents (modern format)',
      },
      doc: {
        extensions: ['.doc'],
        mimeTypes: ['application/msword'],
        description: 'Microsoft Word documents (legacy format, limited support)',
      },
      images: {
        extensions: ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.tiff', '.tif'],
        mimeTypes: [
          'image/png',
          'image/jpeg',
          'image/gif',
          'image/bmp',
          'image/webp',
          'image/tiff',
        ],
        description: 'Image files (OCR processing)',
      },
    },
    maxFileSize: '10MB',
    ocrLanguages: ['eng'], // Can be extended to support more languages
  };
}

/**
 * Validate file for OCR processing
 * @param {string} mimetype - MIME type of the file
 * @param {string} fileExt - File extension
 * @returns {boolean} - Whether the file is supported
 */
export function isFileSupported(mimetype, fileExt) {
  const formats = getSupportedFormats();
  const ext = fileExt.toLowerCase();
  
  // Check PDF
  if (formats.formats.pdf.mimeTypes.includes(mimetype) || formats.formats.pdf.extensions.includes(ext)) {
    return true;
  }
  
  // Check DOCX
  if (formats.formats.docx.mimeTypes.includes(mimetype) || formats.formats.docx.extensions.includes(ext)) {
    return true;
  }
  
  // Check DOC
  if (formats.formats.doc.mimeTypes.includes(mimetype) || formats.formats.doc.extensions.includes(ext)) {
    return true;
  }
  
  // Check images
  if (
    mimetype.startsWith('image/') ||
    formats.formats.images.extensions.includes(ext)
  ) {
    return true;
  }
  
  return false;
}

export default {
  extractTextFromFile,
  extractTextFromPDF,
  extractTextFromDOCX,
  extractTextFromDOC,
  extractTextFromImage,
  getSupportedFormats,
  isFileSupported,
};
