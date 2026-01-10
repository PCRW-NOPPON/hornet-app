import { useOutletContext } from 'react-router-dom';
import { useCases } from '../context/CaseContext';
import { useState } from 'react';
import { jsPDF } from 'jspdf';
import { FileText, Check } from 'lucide-react';

export default function CaseDocuments() {
    const { caseData, caseId } = useOutletContext();
    const { updateCase } = useCases();
    const [showModal, setShowModal] = useState(false);
    const [selectedTemplates, setSelectedTemplates] = useState(['arrest_warrant', 'report']);

    const templates = [
        { id: 'arrest_warrant', name: 'คำร้องขอหมายจับ', checked: true },
        { id: 'search_warrant', name: 'คำร้องขอหมายค้น', checked: false },
        { id: 'arrest_record', name: 'บันทึกจับกุม', checked: true },
        { id: 'report', name: 'รายงานการสอบสวน', checked: true },
    ];

    const docData = caseData.documents || {};

    const handleDocDataChange = (field, value) => {
        updateCase(caseId, { documents: { ...docData, [field]: value } });
    };

    const handleTemplateToggle = (id) => {
        setSelectedTemplates(prev =>
            prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
        );
    };

    const handleGenerate = () => {
        // Generate a real PDF
        const doc = new jsPDF();

        // Basic PDF content
        doc.setFontSize(18);
        doc.text(`Case Report: ${caseData.id}`, 20, 20);
        doc.setFontSize(12);
        doc.text(`Title: ${caseData.title}`, 20, 35);
        doc.text(`Submission Date: ${docData.submissionDate || 'N/A'}`, 20, 45);
        doc.text(`Report Date: ${docData.reportDate || 'N/A'}`, 20, 55);
        doc.text(`Outcome: ${docData.outcome || 'N/A'}`, 20, 65);

        doc.text('--- People Involved ---', 20, 80);
        (caseData.people || []).forEach((p, i) => {
            doc.text(`${i + 1}. ${p.name} (${p.type})`, 20, 90 + i * 10);
        });

        // Trigger download
        doc.save(`Case_${caseData.id}_Report.pdf`);

        setShowModal(true);
    };

    return (
        <div className="detail-layout">
            <div className="detail-sidebar" style={{ width: '250px' }}>
                <div className="menu-group-label">TEMPLATES ({selectedTemplates.length})</div>
                <div style={{ marginLeft: '10px' }}>
                    {templates.map(t => (
                        <div
                            key={t.id}
                            className="nav-item"
                            onClick={() => handleTemplateToggle(t.id)}
                            style={{ background: selectedTemplates.includes(t.id) ? '#ebf5ff' : '' }}
                        >
                            <input type="checkbox" checked={selectedTemplates.includes(t.id)} readOnly /> {t.name}
                        </div>
                    ))}
                </div>
            </div>

            <div className="detail-content">
                <h3>ต้องกรอกข้อมูลเพิ่มเติม</h3>
                <p style={{ color: '#666', marginBottom: '2rem' }}>Template ต้องการข้อมูลเพิ่มอีก 3 รายการ</p>

                <div className="form-section">
                    <label className="form-label">กรุณากรอกข้อมูลที่ยังขาด</label>

                    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ color: '#666' }}>วันที่ส่งเอกสาร:</div>
                        <input type="date" className="form-input" style={{ marginBottom: 0 }} value={docData.submissionDate || ''} onChange={e => handleDocDataChange('submissionDate', e.target.value)} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ color: '#666' }}>วันที่รับแจ้งความ:</div>
                        <input type="date" className="form-input" style={{ marginBottom: 0 }} value={docData.reportDate || ''} onChange={e => handleDocDataChange('reportDate', e.target.value)} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ color: '#666' }}>ผลคดี:</div>
                        <input type="text" className="form-input" style={{ marginBottom: 0 }} value={docData.outcome || ''} onChange={e => handleDocDataChange('outcome', e.target.value)} />
                    </div>
                </div>

                <div style={{ textAlign: 'right', marginTop: '3rem' }}>
                    <button className="btn btn-black" onClick={handleGenerate}>
                        <FileText size={16} /> สร้างเอกสาร ({selectedTemplates.length} ไฟล์)
                    </button>
                </div>
            </div>

            {/* Success Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div style={{ width: '60px', height: '60px', background: '#e8f5e9', borderRadius: '50%', color: '#4caf50', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            <Check size={32} />
                        </div>
                        <h3>สร้างเอกสารเสร็จสมบูรณ์</h3>
                        <p style={{ color: '#666', margin: '1rem 0' }}>ระบบได้สร้างไฟล์ PDF เรียบร้อยแล้ว และได้ดาวน์โหลดไปยังเครื่องของคุณ</p>
                        <button className="btn btn-black" onClick={() => setShowModal(false)}>ปิด</button>
                    </div>
                </div>
            )}
        </div>
    );
}
