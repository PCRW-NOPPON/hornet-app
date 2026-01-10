import { useOutletContext } from 'react-router-dom';
import { useCases } from '../context/CaseContext';
import { useState, useRef } from 'react';
import { extractTextFromImage, splitIntoChunks } from '../services/ocrService';
import { extractWithPrompt, getApiKey, setApiKey } from '../services/aiService';
import { Upload, FileText, Sparkles, Settings, Loader2 } from 'lucide-react';

export default function CaseCollect() {
    const { caseData, caseId } = useOutletContext();
    const { addDocument, getCase } = useCases();
    const fileInputRef = useRef(null);

    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [extractedText, setExtractedText] = useState('');

    const [prompt, setPrompt] = useState('');
    const [aiResult, setAiResult] = useState('');
    const [isExtracting, setIsExtracting] = useState(false);
    const [error, setError] = useState('');

    // API Key management
    const [showApiKeyModal, setShowApiKeyModal] = useState(false);
    const [tempApiKey, setTempApiKey] = useState(getApiKey());

    const uploadedDocs = caseData.uploadedDocuments || [];

    // Combine all document texts for RAG context
    const ragContext = uploadedDocs.map(d => d.rawText).join('\n\n---\n\n');

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        setProgress(0);
        setError('');

        try {
            const result = await extractTextFromImage(file, setProgress);
            const chunks = splitIntoChunks(result.text);

            // Save to case
            addDocument(caseId, {
                id: Date.now(),
                filename: file.name,
                rawText: result.text,
                chunks: chunks,
                confidence: result.confidence,
                addedAt: new Date().toISOString()
            });

            setExtractedText(result.text);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsProcessing(false);
            setProgress(0);
        }
    };

    const handleExtractWithAI = async () => {
        if (!prompt.trim()) {
            setError('กรุณาใส่คำสั่งก่อน');
            return;
        }

        const apiKey = getApiKey();
        if (!apiKey) {
            setShowApiKeyModal(true);
            return;
        }

        setIsExtracting(true);
        setError('');

        try {
            const result = await extractWithPrompt(ragContext, prompt, apiKey);
            setAiResult(result);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsExtracting(false);
        }
    };

    const handleSaveApiKey = () => {
        setApiKey(tempApiKey);
        setShowApiKeyModal(false);
    };

    return (
        <div className="detail-layout">
            {/* Left sidebar - Uploaded Documents */}
            <div className="detail-sidebar" style={{ width: '250px' }}>
                <div className="menu-group-label">UPLOADED DOCUMENTS ({uploadedDocs.length})</div>
                {uploadedDocs.map(doc => (
                    <div key={doc.id} className="nav-item" onClick={() => setExtractedText(doc.rawText)}>
                        <FileText size={16} /> {doc.filename}
                    </div>
                ))}
                <button
                    className="btn btn-white"
                    style={{ width: '100%', marginTop: '1rem' }}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                >
                    {isProcessing ? <><Loader2 size={16} className="spin" /> OCR {progress}%</> : <><Upload size={16} /> อัปโหลดเอกสาร</>}
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/*,.pdf"
                    onChange={handleFileSelect}
                />

                <div style={{ marginTop: '2rem' }}>
                    <button className="btn btn-white" style={{ width: '100%' }} onClick={() => setShowApiKeyModal(true)}>
                        <Settings size={16} /> ตั้งค่า API Key
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="detail-content">
                <h3>AI Document Extraction</h3>
                <p style={{ color: '#666', marginBottom: '2rem' }}>อัปโหลดเอกสาร → OCR อ่านข้อความ → ใช้ AI สกัดข้อมูลตาม Prompt</p>

                {error && (
                    <div style={{ background: '#ffebee', color: '#c62828', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                        {error}
                    </div>
                )}

                {/* Extracted Text Preview */}
                {extractedText && (
                    <div className="form-section">
                        <label className="form-label">ข้อความที่ OCR ได้:</label>
                        <textarea
                            className="form-input"
                            value={extractedText}
                            readOnly
                            rows={8}
                            style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                        />
                    </div>
                )}

                {/* AI Prompt Section */}
                {uploadedDocs.length > 0 && (
                    <div className="form-section" style={{ background: '#f5f5f5', padding: '1.5rem', borderRadius: '8px' }}>
                        <label className="form-label">
                            <Sparkles size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                            คำสั่งสำหรับ AI (Prompt)
                        </label>
                        <textarea
                            className="form-input"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="ตัวอย่าง: สรุปชื่อผู้ต้องหาและข้อหา, ดึงวันที่เกิดเหตุ, หาเลขบัตรประชาชนทั้งหมด"
                            rows={3}
                        />
                        <button
                            className="btn btn-black"
                            onClick={handleExtractWithAI}
                            disabled={isExtracting}
                            style={{ marginTop: '1rem' }}
                        >
                            {isExtracting ? <><Loader2 size={16} className="spin" /> กำลังวิเคราะห์...</> : <><Sparkles size={16} /> สกัดข้อมูลด้วย AI</>}
                        </button>
                    </div>
                )}

                {/* AI Result */}
                {aiResult && (
                    <div className="form-section" style={{ marginTop: '2rem' }}>
                        <label className="form-label" style={{ color: '#1976D2' }}>ผลลัพธ์จาก AI:</label>
                        <div style={{ background: '#e3f2fd', padding: '1.5rem', borderRadius: '8px', whiteSpace: 'pre-wrap' }}>
                            {aiResult}
                        </div>
                    </div>
                )}
            </div>

            {/* API Key Modal */}
            {showApiKeyModal && (
                <div className="modal-overlay" onClick={() => setShowApiKeyModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>ตั้งค่า Gemini API Key</h3>
                        <p style={{ color: '#666', margin: '1rem 0' }}>กรุณากรอก API Key จาก Google AI Studio</p>
                        <input
                            type="password"
                            className="form-input"
                            value={tempApiKey}
                            onChange={(e) => setTempApiKey(e.target.value)}
                            placeholder="AIzaSy..."
                        />
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button className="btn btn-white" onClick={() => setShowApiKeyModal(false)}>ยกเลิก</button>
                            <button className="btn btn-black" onClick={handleSaveApiKey}>บันทึก</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
