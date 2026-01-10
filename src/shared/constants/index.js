/**
 * Hornet AI - Shared Constants
 * Centralized constants for type safety and consistency
 */

// =============================================
// CASE STATUS
// =============================================
export const CASE_STATUS = Object.freeze({
  DRAFT: 'draft',
  IN_REVIEW: 'in_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ARCHIVED: 'archived',
});

export const CASE_STATUS_LABELS = Object.freeze({
  [CASE_STATUS.DRAFT]: 'ร่าง',
  [CASE_STATUS.IN_REVIEW]: 'รอตรวจสอบ',
  [CASE_STATUS.APPROVED]: 'อนุมัติ',
  [CASE_STATUS.REJECTED]: 'ปฏิเสธ',
  [CASE_STATUS.ARCHIVED]: 'เก็บถาวร',
});

export const CASE_STATUS_COLORS = Object.freeze({
  [CASE_STATUS.DRAFT]: '#FFA726',
  [CASE_STATUS.IN_REVIEW]: '#42A5F5',
  [CASE_STATUS.APPROVED]: '#66BB6A',
  [CASE_STATUS.REJECTED]: '#EF5350',
  [CASE_STATUS.ARCHIVED]: '#BDBDBD',
});

// Valid state transitions
export const CASE_STATUS_TRANSITIONS = Object.freeze({
  [CASE_STATUS.DRAFT]: [CASE_STATUS.IN_REVIEW],
  [CASE_STATUS.IN_REVIEW]: [CASE_STATUS.APPROVED, CASE_STATUS.REJECTED],
  [CASE_STATUS.APPROVED]: [CASE_STATUS.ARCHIVED],
  [CASE_STATUS.REJECTED]: [CASE_STATUS.DRAFT],
  [CASE_STATUS.ARCHIVED]: [],
});

// =============================================
// PERSON TYPES
// =============================================
export const PERSON_TYPE = Object.freeze({
  ACCUSER: 'accuser',
  DEFENDANT: 'defendant',
  WITNESS: 'witness',
  RELATED: 'related',
});

export const PERSON_TYPE_LABELS = Object.freeze({
  [PERSON_TYPE.ACCUSER]: 'ผู้กล่าวหา',
  [PERSON_TYPE.DEFENDANT]: 'ผู้ต้องหา',
  [PERSON_TYPE.WITNESS]: 'พยาน',
  [PERSON_TYPE.RELATED]: 'ผู้เกี่ยวข้อง',
});

export const PERSON_TYPE_COLORS = Object.freeze({
  [PERSON_TYPE.ACCUSER]: '#1976D2',
  [PERSON_TYPE.DEFENDANT]: '#D32F2F',
  [PERSON_TYPE.WITNESS]: '#388E3C',
  [PERSON_TYPE.RELATED]: '#757575',
});

// =============================================
// GENDER
// =============================================
export const GENDER = Object.freeze({
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other',
});

export const GENDER_LABELS = Object.freeze({
  [GENDER.MALE]: 'ชาย',
  [GENDER.FEMALE]: 'หญิง',
  [GENDER.OTHER]: 'อื่นๆ',
});

// =============================================
// DOCUMENT TYPES
// =============================================
export const DOCUMENT_TYPE = Object.freeze({
  ARREST_WARRANT: 'arrest_warrant',
  SEARCH_WARRANT: 'search_warrant',
  ARREST_RECORD: 'arrest_record',
  INVESTIGATION_REPORT: 'investigation_report',
  EVIDENCE: 'evidence',
  STATEMENT: 'statement',
  OTHER: 'other',
});

export const DOCUMENT_TYPE_LABELS = Object.freeze({
  [DOCUMENT_TYPE.ARREST_WARRANT]: 'คำร้องขอหมายจับ',
  [DOCUMENT_TYPE.SEARCH_WARRANT]: 'คำร้องขอหมายค้น',
  [DOCUMENT_TYPE.ARREST_RECORD]: 'บันทึกจับกุม',
  [DOCUMENT_TYPE.INVESTIGATION_REPORT]: 'รายงานการสอบสวน',
  [DOCUMENT_TYPE.EVIDENCE]: 'หลักฐาน',
  [DOCUMENT_TYPE.STATEMENT]: 'คำให้การ',
  [DOCUMENT_TYPE.OTHER]: 'อื่นๆ',
});

// =============================================
// OCR STATUS
// =============================================
export const OCR_STATUS = Object.freeze({
  IDLE: 'idle',
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
});

// =============================================
// AI EXTRACTION STATUS
// =============================================
export const AI_STATUS = Object.freeze({
  IDLE: 'idle',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
});

// =============================================
// VALIDATION
// =============================================
export const VALIDATION = Object.freeze({
  PHONE_PATTERN: /^0[0-9]{8,9}$/,
  NATIONAL_ID_PATTERN: /^[0-9]{13}$/,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  CASE_NUMBER_PATTERN: /^[0-9]{1,4}\/[0-9]{4}$/,
});

// =============================================
// PAGINATION
// =============================================
export const PAGINATION = Object.freeze({
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
});

// =============================================
// STORAGE KEYS
// =============================================
export const STORAGE_KEYS = Object.freeze({
  CASES: 'hornet_cases',
  API_KEY: 'hornet_api_key',
  USER_PREFERENCES: 'hornet_preferences',
  AUTH_TOKEN: 'hornet_auth_token',
});

// =============================================
// API ENDPOINTS (for future backend)
// =============================================
export const API_ENDPOINTS = Object.freeze({
  CASES: '/api/cases',
  PEOPLE: '/api/people',
  DOCUMENTS: '/api/documents',
  AUTH: '/api/auth',
  AI: '/api/ai',
});
