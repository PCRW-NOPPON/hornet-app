/**
 * Hornet AI - OCR Service (Refactored)
 * Production-ready OCR with proper error handling and progress tracking
 */

import Tesseract from 'tesseract.js';
import { OCR_STATUS } from '../../../shared/constants';
import { logger, createError } from '../../../shared/utils';

// =============================================
// CONFIGURATION
// =============================================

const OCR_CONFIG = {
  languages: 'tha+eng', // Thai + English for mixed documents
  workerPath: undefined, // Use default CDN
  corePath: undefined, // Use default CDN
  langPath: undefined, // Use default CDN
  cacheMethod: 'readOnly', // Use cached language data
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];

// =============================================
// ERROR CODES
// =============================================

export const OCR_ERROR_CODES = {
  FILE_TOO_LARGE: 'OCR_FILE_TOO_LARGE',
  UNSUPPORTED_TYPE: 'OCR_UNSUPPORTED_TYPE',
  PROCESSING_FAILED: 'OCR_PROCESSING_FAILED',
  NO_TEXT_FOUND: 'OCR_NO_TEXT_FOUND',
  WORKER_ERROR: 'OCR_WORKER_ERROR',
};

// =============================================
// FILE VALIDATION
// =============================================

/**
 * Validate file before OCR processing
 */
export function validateFile(file) {
  if (!file) {
    return { valid: false, error: 'ไม่ได้เลือกไฟล์' };
  }

  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(2);
    return {
      valid: false,
      error: `ไฟล์ใหญ่เกินไป (${sizeMB}MB) สูงสุด 10MB`,
      code: OCR_ERROR_CODES.FILE_TOO_LARGE,
    };
  }

  if (!SUPPORTED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `ไม่รองรับไฟล์ประเภท ${file.type} กรุณาใช้ JPG, PNG หรือ GIF`,
      code: OCR_ERROR_CODES.UNSUPPORTED_TYPE,
    };
  }

  return { valid: true };
}

// =============================================
// OCR EXTRACTION
// =============================================

/**
 * Extract text from image using Tesseract OCR
 * @param {File} imageFile - The image file to process
 * @param {object} options - Configuration options
 */
export async function extractTextFromImage(imageFile, options = {}) {
  const {
    onProgress = () => {},
    languages = OCR_CONFIG.languages,
  } = options;

  // Validate file
  const validation = validateFile(imageFile);
  if (!validation.valid) {
    throw createError(validation.error, validation.code);
  }

  logger.info('OCR processing started', {
    filename: imageFile.name,
    fileSize: imageFile.size,
    fileType: imageFile.type,
  });

  onProgress({
    status: OCR_STATUS.PROCESSING,
    progress: 0,
    message: 'เริ่มต้นการอ่านเอกสาร...',
  });

  try {
    const startTime = Date.now();

    const result = await Tesseract.recognize(imageFile, languages, {
      logger: (m) => {
        // Map Tesseract status to our progress
        if (m.status === 'loading tesseract core') {
          onProgress({
            status: OCR_STATUS.PROCESSING,
            progress: 5,
            message: 'กำลังโหลด OCR Engine...',
          });
        } else if (m.status === 'initializing tesseract') {
          onProgress({
            status: OCR_STATUS.PROCESSING,
            progress: 10,
            message: 'กำลังเริ่มต้น OCR...',
          });
        } else if (m.status === 'loading language traineddata') {
          onProgress({
            status: OCR_STATUS.PROCESSING,
            progress: 20,
            message: 'กำลังโหลดข้อมูลภาษาไทย...',
          });
        } else if (m.status === 'initializing api') {
          onProgress({
            status: OCR_STATUS.PROCESSING,
            progress: 30,
            message: 'กำลังเตรียมระบบ...',
          });
        } else if (m.status === 'recognizing text') {
          const progress = Math.round(30 + m.progress * 65);
          onProgress({
            status: OCR_STATUS.PROCESSING,
            progress,
            message: `กำลังอ่านข้อความ... ${Math.round(m.progress * 100)}%`,
          });
        }
      },
    });

    const processingTime = Date.now() - startTime;
    const extractedText = result.data.text.trim();

    // Validate result
    if (!extractedText || extractedText.length === 0) {
      logger.warn('OCR completed but no text found', { filename: imageFile.name });
      throw createError('ไม่พบข้อความในภาพ กรุณาตรวจสอบภาพอีกครั้ง', OCR_ERROR_CODES.NO_TEXT_FOUND);
    }

    logger.info('OCR processing completed', {
      filename: imageFile.name,
      textLength: extractedText.length,
      confidence: result.data.confidence,
      processingTimeMs: processingTime,
    });

    onProgress({
      status: OCR_STATUS.COMPLETED,
      progress: 100,
      message: 'อ่านเอกสารเสร็จสมบูรณ์',
    });

    return {
      success: true,
      text: extractedText,
      confidence: result.data.confidence,
      metadata: {
        filename: imageFile.name,
        fileSize: imageFile.size,
        processingTimeMs: processingTime,
        languages,
        wordCount: extractedText.split(/\s+/).length,
        lineCount: extractedText.split('\n').length,
      },
    };
  } catch (error) {
    // If it's our custom error, re-throw
    if (error.code && error.code.startsWith('OCR_')) {
      throw error;
    }

    logger.error('OCR processing failed', error, {
      filename: imageFile.name,
      errorMessage: error.message,
    });

    onProgress({
      status: OCR_STATUS.FAILED,
      progress: 0,
      message: 'เกิดข้อผิดพลาดในการอ่านเอกสาร',
    });

    throw createError(
      `ไม่สามารถอ่านเอกสารได้: ${error.message}`,
      OCR_ERROR_CODES.PROCESSING_FAILED
    );
  }
}

// =============================================
// TEXT CHUNKING FOR RAG
// =============================================

/**
 * Split text into chunks for RAG storage
 * Improved chunking with better boundary detection
 */
export function splitIntoChunks(text, options = {}) {
  const {
    chunkSize = 500,
    overlap = 50,
    preserveSentences = true,
  } = options;

  if (!text || text.trim().length === 0) {
    return [];
  }

  const cleanedText = text.trim();
  const chunks = [];
  let start = 0;

  while (start < cleanedText.length) {
    let end = Math.min(start + chunkSize, cleanedText.length);

    // Try to break at natural boundaries if preserving sentences
    if (preserveSentences && end < cleanedText.length) {
      // Look for sentence endings (Thai uses different punctuation)
      const searchStart = Math.max(start + chunkSize - 100, start);
      const searchText = cleanedText.slice(searchStart, end + 50);

      // Find best break point
      const breakPoints = [
        searchText.lastIndexOf('।'), // Thai sentence end
        searchText.lastIndexOf('ฯ'), // Thai etc.
        searchText.lastIndexOf('\n\n'), // Paragraph
        searchText.lastIndexOf('\n'), // Line
        searchText.lastIndexOf('。'), // Chinese/Japanese period
        searchText.lastIndexOf('.'), // English period
        searchText.lastIndexOf('!'),
        searchText.lastIndexOf('?'),
      ];

      const bestBreak = Math.max(...breakPoints.filter((p) => p > 0));

      if (bestBreak > 0) {
        end = searchStart + bestBreak + 1;
      }
    }

    const chunk = cleanedText.slice(start, end).trim();

    if (chunk.length > 0) {
      chunks.push({
        text: chunk,
        startIndex: start,
        endIndex: end,
        index: chunks.length,
      });
    }

    // Move start with overlap for context preservation
    start = end - overlap;

    // Prevent infinite loop
    if (start >= cleanedText.length - 1) break;
  }

  logger.debug('Text chunking completed', {
    totalLength: cleanedText.length,
    chunkCount: chunks.length,
    avgChunkSize: Math.round(cleanedText.length / chunks.length),
  });

  return chunks;
}

/**
 * Simple chunk splitting (returns string array for backward compatibility)
 */
export function splitIntoChunksSimple(text, chunkSize = 500) {
  const chunks = splitIntoChunks(text, { chunkSize, overlap: 0 });
  return chunks.map((c) => c.text);
}

// =============================================
// TEXT PREPROCESSING
// =============================================

/**
 * Clean OCR text (remove artifacts, normalize whitespace)
 */
export function cleanOcrText(text) {
  if (!text) return '';

  return text
    // Normalize Thai characters
    .replace(/\u200B/g, '') // Zero-width space
    .replace(/\u00A0/g, ' ') // Non-breaking space
    // Remove common OCR artifacts
    .replace(/[|\\]/g, '') // Pipe and backslash artifacts
    .replace(/[^\S\n]+/g, ' ') // Multiple spaces to single
    .replace(/\n{3,}/g, '\n\n') // Multiple newlines to double
    .trim();
}

/**
 * Extract structured data patterns from text
 */
export function extractPatterns(text) {
  const patterns = {
    // Thai national ID
    nationalIds: text.match(/[0-9]-[0-9]{4}-[0-9]{5}-[0-9]{2}-[0-9]/g) || [],
    // Phone numbers
    phones: text.match(/0[0-9]{1,2}[-\s]?[0-9]{3}[-\s]?[0-9]{4}/g) || [],
    // Dates (Thai format)
    dates: text.match(/[0-9]{1,2}[\s/\-.][ก-ฮ]+[\s/\-.][0-9]{4}/g) || [],
    // Case numbers
    caseNumbers: text.match(/[0-9]{1,4}\/[0-9]{4}/g) || [],
    // Emails
    emails: text.match(/[^\s@]+@[^\s@]+\.[^\s@]+/g) || [],
  };

  return patterns;
}

// =============================================
// BATCH PROCESSING
// =============================================

/**
 * Process multiple images in batch
 */
export async function batchExtract(files, options = {}) {
  const { onFileProgress = () => {}, onBatchProgress = () => {} } = options;

  const results = [];
  const total = files.length;

  for (let i = 0; i < total; i++) {
    const file = files[i];

    onBatchProgress({
      current: i + 1,
      total,
      progress: Math.round(((i + 1) / total) * 100),
      currentFile: file.name,
    });

    try {
      const result = await extractTextFromImage(file, {
        onProgress: (progress) => {
          onFileProgress({
            fileIndex: i,
            filename: file.name,
            ...progress,
          });
        },
      });

      results.push({
        filename: file.name,
        ...result,
      });
    } catch (error) {
      results.push({
        filename: file.name,
        success: false,
        error: error.message,
      });
    }
  }

  const successCount = results.filter((r) => r.success).length;

  logger.info('Batch OCR completed', {
    totalFiles: total,
    successCount,
    failedCount: total - successCount,
  });

  return {
    results,
    summary: {
      total,
      success: successCount,
      failed: total - successCount,
    },
  };
}

export default {
  validateFile,
  extractTextFromImage,
  splitIntoChunks,
  splitIntoChunksSimple,
  cleanOcrText,
  extractPatterns,
  batchExtract,
  OCR_ERROR_CODES,
};
