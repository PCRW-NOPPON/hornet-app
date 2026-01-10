import { createContext, useContext, useState, useEffect } from 'react';

const CaseContext = createContext();

// Mock initial data
const INITIAL_CASES = [
    {
        id: '2568-10-7070',
        title: 'เคสซื้อของไม่ได้ของ',
        description: 'นายพายุ ร่ำลึกคุณปฐพี',
        createdAt: '2568-10-09',
        status: 'draft',
        lastEdit: '59 นาทีที่แล้ว',
        people: [
            { id: 1, type: 'ผู้กล่าวหา', name: 'นางสาว จิรัชญาณิช กัดดีเดโช', gender: 'หญิง', phone: '0942293565', address: '688 หมู่ 4 อำเภอแม่สาย เชียงราย' },
            { id: 2, type: 'ผู้ต้องหา', name: 'นาย ทรงวุฒิ โชมมัย', gender: 'ชาย', phone: '', address: '' },
            { id: 3, type: 'ผู้ต้องหา', name: 'นาย ทวีศักดิ์ ลุงงางหว้า', gender: 'ชาย', phone: '', address: '' },
        ],
        documents: {
            submissionDate: '2025-10-10',
            reportDate: '2025-09-24',
            outcome: 'สั่งฟ้อง',
        },
        uploadedDocuments: [] // RAG storage for OCR'd documents
    },
    {
        id: '406/2568',
        title: 'ซื้อของไม่ได้ของ',
        description: 'นายพายุ ร่ำลึกคุณปฐพี',
        createdAt: '2568-10-07',
        status: 'draft',
        lastEdit: '4 ชั่วโมงที่แล้ว',
        people: [],
        documents: {},
        uploadedDocuments: []
    },
];

export function CaseProvider({ children }) {
    const [cases, setCases] = useState(() => {
        // Load from localStorage if available
        const saved = localStorage.getItem('hornet_cases');
        return saved ? JSON.parse(saved) : INITIAL_CASES;
    });

    // Persist to localStorage on change
    useEffect(() => {
        localStorage.setItem('hornet_cases', JSON.stringify(cases));
    }, [cases]);

    const getCase = (id) => cases.find(c => c.id === id);

    const updateCase = (id, updates) => {
        setCases(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    };

    const addCase = (newCase) => {
        setCases(prev => [...prev, { ...newCase, uploadedDocuments: [] }]);
    };

    // Add a document to a case's RAG storage
    const addDocument = (caseId, doc) => {
        setCases(prev => prev.map(c => {
            if (c.id === caseId) {
                return {
                    ...c,
                    uploadedDocuments: [...(c.uploadedDocuments || []), doc]
                };
            }
            return c;
        }));
    };

    return (
        <CaseContext.Provider value={{ cases, getCase, updateCase, addCase, addDocument }}>
            {children}
        </CaseContext.Provider>
    );
}

export function useCases() {
    return useContext(CaseContext);
}
