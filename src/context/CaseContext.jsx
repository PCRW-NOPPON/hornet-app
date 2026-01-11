import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const CaseContext = createContext();

// Generate UUID
function generateId() {
    return crypto.randomUUID ? crypto.randomUUID() :
        'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
}

// Person type constants
export const PERSON_TYPES = {
    ACCUSER: 'ผู้กล่าวหา',
    DEFENDANT: 'ผู้ต้องหา',
    WITNESS: 'พยาน',
    RELATED: 'ผู้เกี่ยวข้อง'
};

// Mock initial data
const INITIAL_CASES = [
    {
        id: '2568-10-7070',
        title: 'เคสซื้อของไม่ได้ของ',
        description: 'นายพายุ ร่ำลึกคุณปฐพี',
        createdAt: '2568-10-09',
        updatedAt: new Date().toISOString(),
        status: 'draft',
        lastEdit: '59 นาทีที่แล้ว',
        people: [
            { id: generateId(), type: 'ผู้กล่าวหา', name: 'นางสาว จิรัชญาณิช กัดดีเดโช', gender: 'หญิง', phone: '0942293565', address: '688 หมู่ 4 อำเภอแม่สาย เชียงราย' },
            { id: generateId(), type: 'ผู้ต้องหา', name: 'นาย ทรงวุฒิ โชมมัย', gender: 'ชาย', phone: '', address: '' },
            { id: generateId(), type: 'ผู้ต้องหา', name: 'นาย ทวีศักดิ์ ลุงงางหว้า', gender: 'ชาย', phone: '', address: '' },
        ],
        documents: {
            submissionDate: '2025-10-10',
            reportDate: '2025-09-24',
            outcome: 'สั่งฟ้อง',
        },
        uploadedDocuments: []
    },
    {
        id: '406/2568',
        title: 'ซื้อของไม่ได้ของ',
        description: 'นายพายุ ร่ำลึกคุณปฐพี',
        createdAt: '2568-10-07',
        updatedAt: new Date().toISOString(),
        status: 'draft',
        lastEdit: '4 ชั่วโมงที่แล้ว',
        people: [],
        documents: {},
        uploadedDocuments: []
    },
];

export function CaseProvider({ children }) {
    const [cases, setCases] = useState(() => {
        try {
            const saved = localStorage.getItem('hornet_cases');
            return saved ? JSON.parse(saved) : INITIAL_CASES;
        } catch {
            return INITIAL_CASES;
        }
    });

    // Persist to localStorage on change
    useEffect(() => {
        try {
            localStorage.setItem('hornet_cases', JSON.stringify(cases));
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
        }
    }, [cases]);

    const getCase = useCallback((id) => cases.find(c => c.id === id), [cases]);

    const updateCase = useCallback((id, updates) => {
        setCases(prev => prev.map(c =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
        ));
    }, []);

    const addCase = useCallback((newCase) => {
        const caseWithId = {
            id: newCase.id || generateId(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'draft',
            people: [],
            documents: {},
            uploadedDocuments: [],
            ...newCase,
        };
        setCases(prev => [...prev, caseWithId]);
        return caseWithId;
    }, []);

    // DELETE case
    const deleteCase = useCallback((id) => {
        setCases(prev => prev.filter(c => c.id !== id));
    }, []);

    // Add person to case
    const addPerson = useCallback((caseId, personData = {}) => {
        const newPerson = {
            id: generateId(),
            type: PERSON_TYPES.RELATED,
            name: '',
            gender: '',
            phone: '',
            address: '',
            ...personData,
        };
        setCases(prev => prev.map(c => {
            if (c.id === caseId) {
                return {
                    ...c,
                    people: [...(c.people || []), newPerson],
                    updatedAt: new Date().toISOString()
                };
            }
            return c;
        }));
        return newPerson;
    }, []);

    // Update person in case
    const updatePerson = useCallback((caseId, personId, updates) => {
        setCases(prev => prev.map(c => {
            if (c.id === caseId) {
                return {
                    ...c,
                    people: c.people.map(p =>
                        p.id === personId ? { ...p, ...updates } : p
                    ),
                    updatedAt: new Date().toISOString()
                };
            }
            return c;
        }));
    }, []);

    // DELETE person from case
    const deletePerson = useCallback((caseId, personId) => {
        setCases(prev => prev.map(c => {
            if (c.id === caseId) {
                return {
                    ...c,
                    people: c.people.filter(p => p.id !== personId),
                    updatedAt: new Date().toISOString()
                };
            }
            return c;
        }));
    }, []);

    // Add document to case
    const addDocument = useCallback((caseId, doc) => {
        const newDoc = {
            id: generateId(),
            addedAt: new Date().toISOString(),
            ...doc,
        };
        setCases(prev => prev.map(c => {
            if (c.id === caseId) {
                return {
                    ...c,
                    uploadedDocuments: [...(c.uploadedDocuments || []), newDoc],
                    updatedAt: new Date().toISOString()
                };
            }
            return c;
        }));
        return newDoc;
    }, []);

    // Delete document from case
    const deleteDocument = useCallback((caseId, docId) => {
        setCases(prev => prev.map(c => {
            if (c.id === caseId) {
                return {
                    ...c,
                    uploadedDocuments: (c.uploadedDocuments || []).filter(d => d.id !== docId),
                    updatedAt: new Date().toISOString()
                };
            }
            return c;
        }));
    }, []);

    // Search cases
    const searchCases = useCallback((query) => {
        if (!query || query.trim() === '') return cases;
        const q = query.toLowerCase().trim();
        return cases.filter(c =>
            c.id?.toLowerCase().includes(q) ||
            c.title?.toLowerCase().includes(q) ||
            c.description?.toLowerCase().includes(q) ||
            c.people?.some(p => p.name?.toLowerCase().includes(q))
        );
    }, [cases]);

    // Statistics
    const stats = useMemo(() => ({
        totalCases: cases.length,
        totalPeople: cases.reduce((sum, c) => sum + (c.people?.length || 0), 0),
        totalDocuments: cases.reduce((sum, c) => sum + (c.uploadedDocuments?.length || 0), 0),
    }), [cases]);

    const value = useMemo(() => ({
        cases,
        stats,
        getCase,
        updateCase,
        addCase,
        deleteCase,
        addPerson,
        updatePerson,
        deletePerson,
        addDocument,
        deleteDocument,
        searchCases,
        PERSON_TYPES,
    }), [cases, stats, getCase, updateCase, addCase, deleteCase, addPerson, updatePerson, deletePerson, addDocument, deleteDocument, searchCases]);

    return (
        <CaseContext.Provider value={value}>
            {children}
        </CaseContext.Provider>
    );
}

export function useCases() {
    const context = useContext(CaseContext);
    if (!context) {
        throw new Error('useCases must be used within CaseProvider');
    }
    return context;
}
