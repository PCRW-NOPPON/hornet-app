/**
 * Hornet AI - Case Context (Refactored)
 * Production-ready state management with proper error handling
 */

import { createContext, useContext, useCallback, useMemo } from 'react';
import { useLocalStorage } from '../../../shared/hooks/useLocalStorage';
import {
  generateUUID,
  generateCaseNumber,
  getCurrentTimestamp,
  logger,
} from '../../../shared/utils';
import {
  CASE_STATUS,
  CASE_STATUS_TRANSITIONS,
  PERSON_TYPE,
  STORAGE_KEYS,
} from '../../../shared/constants';

// =============================================
// CONTEXT
// =============================================

const CaseContext = createContext(null);

// =============================================
// INITIAL DATA (for demo purposes)
// =============================================

const INITIAL_CASES = [
  {
    id: generateUUID(),
    caseNumber: '7070/2568',
    title: 'เคสซื้อของไม่ได้ของ',
    description: 'นายพายุ ร่ำลึกคุณปฐพี',
    createdAt: '2024-10-09T10:00:00.000Z',
    updatedAt: '2024-10-09T11:00:00.000Z',
    status: CASE_STATUS.DRAFT,
    people: [
      {
        id: generateUUID(),
        type: PERSON_TYPE.ACCUSER,
        firstName: 'จิรัชญาณิช',
        lastName: 'กัดดีเดโช',
        prefix: 'นางสาว',
        gender: 'female',
        phone: '0942293565',
        address: {
          houseNo: '688',
          moo: '4',
          district: 'แม่สาย',
          province: 'เชียงราย',
          country: 'ไทย',
        },
      },
      {
        id: generateUUID(),
        type: PERSON_TYPE.DEFENDANT,
        firstName: 'ทรงวุฒิ',
        lastName: 'โชมมัย',
        prefix: 'นาย',
        gender: 'male',
        phone: '',
        address: null,
      },
      {
        id: generateUUID(),
        type: PERSON_TYPE.DEFENDANT,
        firstName: 'ทวีศักดิ์',
        lastName: 'ลุงงางหว้า',
        prefix: 'นาย',
        gender: 'male',
        phone: '',
        address: null,
      },
    ],
    documents: {
      submissionDate: '2024-10-10',
      reportDate: '2024-09-24',
      outcome: 'สั่งฟ้อง',
    },
    uploadedDocuments: [],
  },
  {
    id: generateUUID(),
    caseNumber: '406/2568',
    title: 'ซื้อของไม่ได้ของ',
    description: 'นายพายุ ร่ำลึกคุณปฐพี',
    createdAt: '2024-10-07T08:00:00.000Z',
    updatedAt: '2024-10-07T12:00:00.000Z',
    status: CASE_STATUS.DRAFT,
    people: [],
    documents: {},
    uploadedDocuments: [],
  },
];

// =============================================
// PROVIDER
// =============================================

export function CaseProvider({ children }) {
  const [cases, setCases, { error: storageError }] = useLocalStorage(
    STORAGE_KEYS.CASES,
    INITIAL_CASES
  );

  // Log storage errors
  if (storageError) {
    logger.error('Storage error in CaseContext', storageError);
  }

  // =============================================
  // CASE OPERATIONS
  // =============================================

  /**
   * Get a single case by ID
   */
  const getCase = useCallback(
    (id) => {
      return cases.find((c) => c.id === id) || null;
    },
    [cases]
  );

  /**
   * Get case by case number
   */
  const getCaseByCaseNumber = useCallback(
    (caseNumber) => {
      return cases.find((c) => c.caseNumber === caseNumber) || null;
    },
    [cases]
  );

  /**
   * Create a new case
   */
  const createCase = useCallback(
    (caseData = {}) => {
      const newCase = {
        id: generateUUID(),
        caseNumber: caseData.caseNumber || generateCaseNumber(),
        title: caseData.title || 'คดีใหม่ (ยังไม่ตั้งชื่อ)',
        description: caseData.description || '',
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp(),
        status: CASE_STATUS.DRAFT,
        people: [],
        documents: {},
        uploadedDocuments: [],
        ...caseData,
      };

      setCases((prev) => [...prev, newCase]);

      logger.info('Case created', { caseId: newCase.id, caseNumber: newCase.caseNumber });

      return newCase;
    },
    [setCases]
  );

  /**
   * Update an existing case
   */
  const updateCase = useCallback(
    (id, updates) => {
      setCases((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;

          const updatedCase = {
            ...c,
            ...updates,
            updatedAt: getCurrentTimestamp(),
          };

          logger.debug('Case updated', { caseId: id, fields: Object.keys(updates) });

          return updatedCase;
        })
      );
    },
    [setCases]
  );

  /**
   * Delete a case (soft delete in production, hard delete for now)
   */
  const deleteCase = useCallback(
    (id) => {
      setCases((prev) => {
        const caseToDelete = prev.find((c) => c.id === id);
        if (!caseToDelete) {
          logger.warn('Attempted to delete non-existent case', { caseId: id });
          return prev;
        }

        logger.info('Case deleted', { caseId: id, caseNumber: caseToDelete.caseNumber });

        return prev.filter((c) => c.id !== id);
      });
    },
    [setCases]
  );

  /**
   * Transition case status with validation
   */
  const transitionCaseStatus = useCallback(
    (id, newStatus) => {
      const caseData = getCase(id);

      if (!caseData) {
        logger.error('Cannot transition status: case not found', null, { caseId: id });
        return { success: false, error: 'Case not found' };
      }

      const allowedTransitions = CASE_STATUS_TRANSITIONS[caseData.status] || [];

      if (!allowedTransitions.includes(newStatus)) {
        logger.warn('Invalid status transition', {
          caseId: id,
          from: caseData.status,
          to: newStatus,
          allowed: allowedTransitions,
        });
        return {
          success: false,
          error: `Cannot transition from ${caseData.status} to ${newStatus}`,
        };
      }

      // Validate requirements for certain transitions
      if (newStatus === CASE_STATUS.IN_REVIEW) {
        if (caseData.people.length === 0) {
          return { success: false, error: 'ต้องมีบุคคลที่เกี่ยวข้องอย่างน้อย 1 คน' };
        }
      }

      updateCase(id, { status: newStatus });

      logger.info('Case status transitioned', {
        caseId: id,
        from: caseData.status,
        to: newStatus,
      });

      return { success: true };
    },
    [getCase, updateCase]
  );

  // =============================================
  // PERSON OPERATIONS
  // =============================================

  /**
   * Add a person to a case
   */
  const addPerson = useCallback(
    (caseId, personData = {}) => {
      const newPerson = {
        id: generateUUID(),
        type: PERSON_TYPE.RELATED,
        firstName: '',
        lastName: '',
        prefix: '',
        gender: '',
        phone: '',
        address: null,
        createdAt: getCurrentTimestamp(),
        ...personData,
      };

      setCases((prev) =>
        prev.map((c) => {
          if (c.id !== caseId) return c;

          return {
            ...c,
            people: [...c.people, newPerson],
            updatedAt: getCurrentTimestamp(),
          };
        })
      );

      logger.debug('Person added to case', { caseId, personId: newPerson.id });

      return newPerson;
    },
    [setCases]
  );

  /**
   * Update a person in a case
   */
  const updatePerson = useCallback(
    (caseId, personId, updates) => {
      setCases((prev) =>
        prev.map((c) => {
          if (c.id !== caseId) return c;

          return {
            ...c,
            people: c.people.map((p) =>
              p.id === personId ? { ...p, ...updates, updatedAt: getCurrentTimestamp() } : p
            ),
            updatedAt: getCurrentTimestamp(),
          };
        })
      );

      logger.debug('Person updated', { caseId, personId });
    },
    [setCases]
  );

  /**
   * Delete a person from a case
   */
  const deletePerson = useCallback(
    (caseId, personId) => {
      setCases((prev) =>
        prev.map((c) => {
          if (c.id !== caseId) return c;

          return {
            ...c,
            people: c.people.filter((p) => p.id !== personId),
            updatedAt: getCurrentTimestamp(),
          };
        })
      );

      logger.debug('Person deleted from case', { caseId, personId });
    },
    [setCases]
  );

  // =============================================
  // DOCUMENT OPERATIONS
  // =============================================

  /**
   * Add a document to a case
   */
  const addDocument = useCallback(
    (caseId, document) => {
      const newDoc = {
        id: generateUUID(),
        createdAt: getCurrentTimestamp(),
        ...document,
      };

      setCases((prev) =>
        prev.map((c) => {
          if (c.id !== caseId) return c;

          return {
            ...c,
            uploadedDocuments: [...(c.uploadedDocuments || []), newDoc],
            updatedAt: getCurrentTimestamp(),
          };
        })
      );

      logger.debug('Document added to case', { caseId, documentId: newDoc.id });

      return newDoc;
    },
    [setCases]
  );

  /**
   * Delete a document from a case
   */
  const deleteDocument = useCallback(
    (caseId, documentId) => {
      setCases((prev) =>
        prev.map((c) => {
          if (c.id !== caseId) return c;

          return {
            ...c,
            uploadedDocuments: (c.uploadedDocuments || []).filter((d) => d.id !== documentId),
            updatedAt: getCurrentTimestamp(),
          };
        })
      );

      logger.debug('Document deleted from case', { caseId, documentId });
    },
    [setCases]
  );

  // =============================================
  // SEARCH & FILTER
  // =============================================

  /**
   * Search cases by query
   */
  const searchCases = useCallback(
    (query) => {
      if (!query || query.trim() === '') {
        return cases;
      }

      const lowerQuery = query.toLowerCase().trim();

      return cases.filter((c) => {
        return (
          c.caseNumber?.toLowerCase().includes(lowerQuery) ||
          c.title?.toLowerCase().includes(lowerQuery) ||
          c.description?.toLowerCase().includes(lowerQuery) ||
          c.people?.some(
            (p) =>
              p.firstName?.toLowerCase().includes(lowerQuery) ||
              p.lastName?.toLowerCase().includes(lowerQuery)
          )
        );
      });
    },
    [cases]
  );

  /**
   * Filter cases by status
   */
  const filterCasesByStatus = useCallback(
    (status) => {
      if (!status || status === 'all') {
        return cases;
      }
      return cases.filter((c) => c.status === status);
    },
    [cases]
  );

  // =============================================
  // STATISTICS
  // =============================================

  const statistics = useMemo(() => {
    return {
      totalCases: cases.length,
      byStatus: {
        [CASE_STATUS.DRAFT]: cases.filter((c) => c.status === CASE_STATUS.DRAFT).length,
        [CASE_STATUS.IN_REVIEW]: cases.filter((c) => c.status === CASE_STATUS.IN_REVIEW).length,
        [CASE_STATUS.APPROVED]: cases.filter((c) => c.status === CASE_STATUS.APPROVED).length,
        [CASE_STATUS.REJECTED]: cases.filter((c) => c.status === CASE_STATUS.REJECTED).length,
        [CASE_STATUS.ARCHIVED]: cases.filter((c) => c.status === CASE_STATUS.ARCHIVED).length,
      },
      totalPeople: cases.reduce((sum, c) => sum + (c.people?.length || 0), 0),
      totalDocuments: cases.reduce((sum, c) => sum + (c.uploadedDocuments?.length || 0), 0),
    };
  }, [cases]);

  // =============================================
  // CONTEXT VALUE
  // =============================================

  const contextValue = useMemo(
    () => ({
      // State
      cases,
      statistics,

      // Case operations
      getCase,
      getCaseByCaseNumber,
      createCase,
      updateCase,
      deleteCase,
      transitionCaseStatus,

      // Person operations
      addPerson,
      updatePerson,
      deletePerson,

      // Document operations
      addDocument,
      deleteDocument,

      // Search & Filter
      searchCases,
      filterCasesByStatus,
    }),
    [
      cases,
      statistics,
      getCase,
      getCaseByCaseNumber,
      createCase,
      updateCase,
      deleteCase,
      transitionCaseStatus,
      addPerson,
      updatePerson,
      deletePerson,
      addDocument,
      deleteDocument,
      searchCases,
      filterCasesByStatus,
    ]
  );

  return <CaseContext.Provider value={contextValue}>{children}</CaseContext.Provider>;
}

// =============================================
// HOOK
// =============================================

export function useCases() {
  const context = useContext(CaseContext);

  if (!context) {
    throw new Error('useCases must be used within a CaseProvider');
  }

  return context;
}

export default CaseContext;
