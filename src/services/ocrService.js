import Tesseract from 'tesseract.js';

/**
 * Extract text from an image file using Tesseract.js OCR
 * @param {File} imageFile - The image file to process
 * @param {function} onProgress - Optional callback for progress updates (0-100)
 * @returns {Promise<{text: string, confidence: number}>}
 */
export async function extractTextFromImage(imageFile, onProgress = () => { }) {
    try {
        const result = await Tesseract.recognize(
            imageFile,
            'tha+eng', // Thai + English for mixed documents
            {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        onProgress(Math.round(m.progress * 100));
                    }
                }
            }
        );

        return {
            text: result.data.text,
            confidence: result.data.confidence
        };
    } catch (error) {
        console.error('OCR Error:', error);
        throw new Error('Failed to extract text from image: ' + error.message);
    }
}

/**
 * Split text into chunks for RAG storage
 * @param {string} text - Full text content
 * @param {number} chunkSize - Size of each chunk (default: 500 chars)
 * @returns {string[]}
 */
export function splitIntoChunks(text, chunkSize = 500) {
    const chunks = [];
    let start = 0;

    while (start < text.length) {
        // Try to break at sentence end or paragraph
        let end = Math.min(start + chunkSize, text.length);
        if (end < text.length) {
            const lastPeriod = text.lastIndexOf('.', end);
            const lastNewline = text.lastIndexOf('\n', end);
            const breakPoint = Math.max(lastPeriod, lastNewline);
            if (breakPoint > start) {
                end = breakPoint + 1;
            }
        }
        chunks.push(text.slice(start, end).trim());
        start = end;
    }

    return chunks.filter(c => c.length > 0);
}
