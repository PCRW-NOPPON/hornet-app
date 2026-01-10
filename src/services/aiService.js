import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Get or set the Gemini API key from localStorage
 */
export function getApiKey() {
    return localStorage.getItem('gemini_api_key') || '';
}

export function setApiKey(key) {
    localStorage.setItem('gemini_api_key', key);
}

/**
 * Extract structured data using Gemini AI with RAG context
 * @param {string} ragContext - The extracted text from documents (RAG context)
 * @param {string} userPrompt - The user's extraction prompt
 * @param {string} apiKey - Gemini API key
 * @returns {Promise<string>} - AI response
 */
export async function extractWithPrompt(ragContext, userPrompt, apiKey) {
    if (!apiKey) {
        throw new Error('กรุณากรอก API Key ก่อนใช้งาน');
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const systemPrompt = `คุณเป็นผู้ช่วยวิเคราะห์เอกสารคดีอาชญากรรมของตำรวจไทย 
คุณจะได้รับเนื้อหาที่ OCR มาจากเอกสาร และคำสั่งจากผู้ใช้
ให้ตอบตามคำสั่งของผู้ใช้โดยอ้างอิงจากเนื้อหาในเอกสารเท่านั้น
หากไม่พบข้อมูลให้ตอบว่า "ไม่พบข้อมูลดังกล่าวในเอกสาร"

=== เนื้อหาจากเอกสาร ===
${ragContext}
=== จบเนื้อหา ===`;

        const result = await model.generateContent([
            { text: systemPrompt },
            { text: `คำสั่ง: ${userPrompt}` }
        ]);

        return result.response.text();
    } catch (error) {
        console.error('AI Extraction Error:', error);
        if (error.message.includes('API_KEY_INVALID')) {
            throw new Error('API Key ไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง');
        }
        throw new Error('เกิดข้อผิดพลาดในการเรียก AI: ' + error.message);
    }
}
