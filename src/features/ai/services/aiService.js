/**
 * Hornet AI - AI Service (Refactored)
 * Production-ready AI integration with proper error handling
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { STORAGE_KEYS, AI_STATUS } from '../../../shared/constants';
import { logger, createError } from '../../../shared/utils';

// =============================================
// CONFIGURATION
// =============================================

const AI_CONFIG = {
  model: 'gemini-2.0-flash',
  maxOutputTokens: 4096,
  temperature: 0.3,
  topP: 0.8,
  topK: 40,
};

const SYSTEM_PROMPT = `คุณเป็นผู้ช่วยวิเคราะห์เอกสารคดีอาชญากรรมของตำรวจไทย

หน้าที่ของคุณ:
1. วิเคราะห์เนื้อหาที่ OCR มาจากเอกสาร
2. สกัดข้อมูลตามคำสั่งของผู้ใช้
3. ตอบเป็นภาษาไทยที่เป็นทางการ
4. อ้างอิงจากเนื้อหาในเอกสารเท่านั้น

กฎสำคัญ:
- หากไม่พบข้อมูล ให้ตอบว่า "ไม่พบข้อมูลดังกล่าวในเอกสาร"
- อย่าสมมติข้อมูลที่ไม่มีในเอกสาร
- รักษาความลับของข้อมูล
- จัดรูปแบบคำตอบให้อ่านง่าย`;

// =============================================
// ERROR CODES
// =============================================

export const AI_ERROR_CODES = {
  NO_API_KEY: 'AI_NO_API_KEY',
  INVALID_API_KEY: 'AI_INVALID_API_KEY',
  RATE_LIMITED: 'AI_RATE_LIMITED',
  QUOTA_EXCEEDED: 'AI_QUOTA_EXCEEDED',
  NETWORK_ERROR: 'AI_NETWORK_ERROR',
  CONTENT_FILTERED: 'AI_CONTENT_FILTERED',
  UNKNOWN_ERROR: 'AI_UNKNOWN_ERROR',
};

// =============================================
// API KEY MANAGEMENT
// =============================================

/**
 * Get API key from secure storage
 * In production, this should use encrypted storage or backend
 */
export function getApiKey() {
  try {
    const key = localStorage.getItem(STORAGE_KEYS.API_KEY);
    return key || '';
  } catch (error) {
    logger.error('Failed to retrieve API key', error);
    return '';
  }
}

/**
 * Save API key to storage
 * WARNING: In production, API keys should be stored on the backend
 */
export function setApiKey(key) {
  try {
    if (!key) {
      localStorage.removeItem(STORAGE_KEYS.API_KEY);
      logger.info('API key removed');
      return true;
    }

    // Basic validation
    if (!key.startsWith('AIza') || key.length < 30) {
      logger.warn('API key format appears invalid');
    }

    localStorage.setItem(STORAGE_KEYS.API_KEY, key);
    logger.info('API key saved');
    return true;
  } catch (error) {
    logger.error('Failed to save API key', error);
    return false;
  }
}

/**
 * Validate API key by making a test request
 */
export async function validateApiKey(apiKey) {
  if (!apiKey) {
    return { valid: false, error: 'No API key provided' };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: AI_CONFIG.model });

    // Simple validation request
    await model.generateContent('test');

    return { valid: true };
  } catch (error) {
    const errorMessage = parseAIError(error);
    return { valid: false, error: errorMessage };
  }
}

// =============================================
// AI EXTRACTION
// =============================================

/**
 * Extract data from documents using AI
 * @param {string} documentText - The OCR'd document text (RAG context)
 * @param {string} userPrompt - User's extraction instruction
 * @param {object} options - Additional options
 */
export async function extractWithAI(documentText, userPrompt, options = {}) {
  const {
    apiKey = getApiKey(),
    onProgress = () => {},
  } = options;

  // Validation
  if (!apiKey) {
    throw createError('กรุณากรอก API Key ก่อนใช้งาน', AI_ERROR_CODES.NO_API_KEY);
  }

  if (!documentText || documentText.trim() === '') {
    throw createError('ไม่มีเอกสารสำหรับวิเคราะห์', 'NO_DOCUMENT');
  }

  if (!userPrompt || userPrompt.trim() === '') {
    throw createError('กรุณาใส่คำสั่งสำหรับ AI', 'NO_PROMPT');
  }

  // Log request (without sensitive data)
  logger.info('AI extraction started', {
    documentLength: documentText.length,
    promptLength: userPrompt.length,
  });

  onProgress({ status: AI_STATUS.PROCESSING, progress: 10 });

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: AI_CONFIG.model,
      generationConfig: {
        maxOutputTokens: AI_CONFIG.maxOutputTokens,
        temperature: AI_CONFIG.temperature,
        topP: AI_CONFIG.topP,
        topK: AI_CONFIG.topK,
      },
    });

    onProgress({ status: AI_STATUS.PROCESSING, progress: 30 });

    // Build the prompt with context
    const fullPrompt = buildPrompt(documentText, userPrompt);

    onProgress({ status: AI_STATUS.PROCESSING, progress: 50 });

    // Generate content
    const result = await model.generateContent(fullPrompt);

    onProgress({ status: AI_STATUS.PROCESSING, progress: 90 });

    // Extract response
    const response = result.response;
    const text = response.text();

    // Log success
    logger.info('AI extraction completed', {
      responseLength: text.length,
      finishReason: response.candidates?.[0]?.finishReason,
    });

    onProgress({ status: AI_STATUS.COMPLETED, progress: 100 });

    return {
      success: true,
      text,
      metadata: {
        promptTokens: result.response.usageMetadata?.promptTokenCount,
        completionTokens: result.response.usageMetadata?.candidatesTokenCount,
        finishReason: response.candidates?.[0]?.finishReason,
      },
    };
  } catch (error) {
    const parsedError = parseAIError(error);

    logger.error('AI extraction failed', error, {
      errorCode: parsedError.code,
      errorMessage: parsedError.message,
    });

    onProgress({ status: AI_STATUS.FAILED, progress: 0 });

    throw createError(parsedError.message, parsedError.code, {
      originalError: error.message,
    });
  }
}

/**
 * Build the full prompt with system instructions
 */
function buildPrompt(documentText, userPrompt) {
  // Truncate document if too long (Gemini has context limits)
  const maxDocLength = 30000;
  const truncatedDoc =
    documentText.length > maxDocLength
      ? documentText.slice(0, maxDocLength) + '\n\n[... เนื้อหาถูกตัดทอนเนื่องจากยาวเกินไป ...]'
      : documentText;

  return `${SYSTEM_PROMPT}

=== เนื้อหาจากเอกสาร ===
${truncatedDoc}
=== จบเนื้อหา ===

คำสั่งจากผู้ใช้: ${userPrompt}

โปรดวิเคราะห์และตอบตามคำสั่งข้างต้น:`;
}

/**
 * Parse AI error to user-friendly message
 */
function parseAIError(error) {
  const message = error.message || String(error);

  if (message.includes('API_KEY_INVALID') || message.includes('API key not valid')) {
    return {
      code: AI_ERROR_CODES.INVALID_API_KEY,
      message: 'API Key ไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง',
    };
  }

  if (message.includes('RATE_LIMIT') || message.includes('429')) {
    return {
      code: AI_ERROR_CODES.RATE_LIMITED,
      message: 'เรียกใช้ AI บ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่',
    };
  }

  if (message.includes('QUOTA') || message.includes('quota')) {
    return {
      code: AI_ERROR_CODES.QUOTA_EXCEEDED,
      message: 'เกินโควต้าการใช้งาน AI กรุณาตรวจสอบบัญชี Google AI Studio',
    };
  }

  if (message.includes('SAFETY') || message.includes('blocked')) {
    return {
      code: AI_ERROR_CODES.CONTENT_FILTERED,
      message: 'เนื้อหาถูกกรองโดยระบบความปลอดภัย กรุณาปรับคำสั่งหรือเอกสาร',
    };
  }

  if (message.includes('network') || message.includes('fetch')) {
    return {
      code: AI_ERROR_CODES.NETWORK_ERROR,
      message: 'ไม่สามารถเชื่อมต่อ AI ได้ กรุณาตรวจสอบอินเทอร์เน็ต',
    };
  }

  return {
    code: AI_ERROR_CODES.UNKNOWN_ERROR,
    message: `เกิดข้อผิดพลาด: ${message}`,
  };
}

// =============================================
// STREAMING EXTRACTION (Advanced)
// =============================================

/**
 * Extract with streaming response (for real-time display)
 */
export async function extractWithAIStream(documentText, userPrompt, options = {}) {
  const {
    apiKey = getApiKey(),
    onChunk = () => {},
    onComplete = () => {},
    onError = () => {},
  } = options;

  if (!apiKey) {
    throw createError('กรุณากรอก API Key ก่อนใช้งาน', AI_ERROR_CODES.NO_API_KEY);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: AI_CONFIG.model,
      generationConfig: {
        maxOutputTokens: AI_CONFIG.maxOutputTokens,
        temperature: AI_CONFIG.temperature,
      },
    });

    const fullPrompt = buildPrompt(documentText, userPrompt);
    const result = await model.generateContentStream(fullPrompt);

    let fullText = '';

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullText += chunkText;
      onChunk(chunkText, fullText);
    }

    onComplete(fullText);

    return { success: true, text: fullText };
  } catch (error) {
    const parsedError = parseAIError(error);
    onError(parsedError);
    throw createError(parsedError.message, parsedError.code);
  }
}

// =============================================
// PREDEFINED PROMPTS
// =============================================

export const PREDEFINED_PROMPTS = {
  extractPeople: 'สกัดรายชื่อบุคคลทั้งหมดที่ปรากฏในเอกสาร พร้อมระบุบทบาท (ผู้กล่าวหา/ผู้ต้องหา/พยาน)',
  extractDates: 'ระบุวันที่สำคัญทั้งหมดในเอกสาร เช่น วันเกิดเหตุ วันแจ้งความ วันจับกุม',
  extractCharges: 'สรุปข้อหาหรือความผิดที่กล่าวหาในคดีนี้',
  extractEvidence: 'ระบุหลักฐานทั้งหมดที่กล่าวถึงในเอกสาร',
  summarize: 'สรุปใจความสำคัญของเอกสารนี้ใน 3-5 ประโยค',
  extractContacts: 'สกัดข้อมูลติดต่อทั้งหมด (เบอร์โทร, ที่อยู่, อีเมล)',
};

export default {
  getApiKey,
  setApiKey,
  validateApiKey,
  extractWithAI,
  extractWithAIStream,
  PREDEFINED_PROMPTS,
  AI_ERROR_CODES,
};
