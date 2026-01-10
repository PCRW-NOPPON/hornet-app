/**
 * Hornet AI - Shared Utilities
 * Production-ready utility functions
 */

// =============================================
// ID GENERATION
// =============================================

/**
 * Generate a UUID v4
 * More reliable than Date.now() for unique IDs
 */
export function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generate a human-readable case number
 * Format: XXX/YYYY (Buddhist Era)
 */
export function generateCaseNumber() {
  const now = new Date();
  const buddhistYear = now.getFullYear() + 543;
  const sequence = Math.floor(Math.random() * 9000) + 1000;
  return `${sequence}/${buddhistYear}`;
}

// =============================================
// DATE FORMATTING
// =============================================

/**
 * Format ISO date to Thai locale string
 */
export function formatDate(isoDate, options = {}) {
  if (!isoDate) return '-';

  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  };

  try {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('th-TH', defaultOptions);
  } catch {
    return '-';
  }
}

/**
 * Format ISO date to input date format (YYYY-MM-DD)
 */
export function formatDateForInput(isoDate) {
  if (!isoDate) return '';
  try {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
}

/**
 * Format relative time (e.g., "5 นาทีที่แล้ว")
 */
export function formatRelativeTime(isoDate) {
  if (!isoDate) return '-';

  try {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return '-';

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'เมื่อสักครู่';
    if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
    if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
    if (diffDays < 7) return `${diffDays} วันที่แล้ว`;

    return formatDate(isoDate, { month: 'short', day: 'numeric' });
  } catch {
    return '-';
  }
}

/**
 * Get current timestamp in ISO format
 */
export function getCurrentTimestamp() {
  return new Date().toISOString();
}

// =============================================
// STRING UTILITIES
// =============================================

/**
 * Sanitize string to prevent XSS
 */
export function sanitizeString(str) {
  if (!str || typeof str !== 'string') return '';

  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };

  return str.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str, maxLength = 50) {
  if (!str || str.length <= maxLength) return str || '';
  return `${str.slice(0, maxLength)}...`;
}

/**
 * Normalize Thai phone number
 */
export function normalizePhone(phone) {
  if (!phone) return '';
  return phone.replace(/[^0-9]/g, '');
}

/**
 * Format Thai phone number (0XX-XXX-XXXX)
 */
export function formatPhone(phone) {
  const normalized = normalizePhone(phone);
  if (normalized.length === 10) {
    return `${normalized.slice(0, 3)}-${normalized.slice(3, 6)}-${normalized.slice(6)}`;
  }
  if (normalized.length === 9) {
    return `${normalized.slice(0, 2)}-${normalized.slice(2, 5)}-${normalized.slice(5)}`;
  }
  return normalized;
}

// =============================================
// VALIDATION
// =============================================

/**
 * Validate Thai national ID (13 digits with checksum)
 */
export function validateNationalId(id) {
  if (!id || !/^[0-9]{13}$/.test(id)) return false;

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(id[i], 10) * (13 - i);
  }

  const checkDigit = (11 - (sum % 11)) % 10;
  return checkDigit === parseInt(id[12], 10);
}

/**
 * Validate Thai phone number
 */
export function validatePhone(phone) {
  const normalized = normalizePhone(phone);
  return /^0[0-9]{8,9}$/.test(normalized);
}

/**
 * Validate email
 */
export function validateEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Check if value is empty (null, undefined, empty string, empty array)
 */
export function isEmpty(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

// =============================================
// ARRAY UTILITIES
// =============================================

/**
 * Group array by key
 */
export function groupBy(array, key) {
  return array.reduce((result, item) => {
    const groupKey = typeof key === 'function' ? key(item) : item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
}

/**
 * Sort array by key (supports nested keys like 'person.name')
 */
export function sortBy(array, key, direction = 'asc') {
  return [...array].sort((a, b) => {
    const getValue = (obj, path) => {
      return path.split('.').reduce((acc, part) => acc?.[part], obj);
    };

    const aVal = getValue(a, key);
    const bVal = getValue(b, key);

    if (aVal === bVal) return 0;
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;

    const comparison = aVal < bVal ? -1 : 1;
    return direction === 'asc' ? comparison : -comparison;
  });
}

// =============================================
// DEBOUNCE / THROTTLE
// =============================================

/**
 * Debounce function
 */
export function debounce(func, wait = 300) {
  let timeoutId = null;

  const debounced = (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), wait);
  };

  debounced.cancel = () => clearTimeout(timeoutId);

  return debounced;
}

/**
 * Throttle function
 */
export function throttle(func, limit = 300) {
  let inThrottle = false;

  return (...args) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

// =============================================
// ERROR HANDLING
// =============================================

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

/**
 * Safe JSON stringify
 */
export function safeJsonStringify(obj, fallback = '{}') {
  try {
    return JSON.stringify(obj);
  } catch {
    return fallback;
  }
}

/**
 * Create error with code and metadata
 */
export function createError(message, code, metadata = {}) {
  const error = new Error(message);
  error.code = code;
  error.metadata = metadata;
  error.timestamp = getCurrentTimestamp();
  return error;
}

// =============================================
// LOGGING
// =============================================

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const currentLogLevel = import.meta.env.DEV ? LOG_LEVELS.DEBUG : LOG_LEVELS.WARN;

/**
 * Structured logger
 */
export const logger = {
  debug: (message, data = {}) => {
    if (currentLogLevel <= LOG_LEVELS.DEBUG) {
      console.debug(`[DEBUG] ${message}`, { timestamp: getCurrentTimestamp(), ...data });
    }
  },

  info: (message, data = {}) => {
    if (currentLogLevel <= LOG_LEVELS.INFO) {
      console.info(`[INFO] ${message}`, { timestamp: getCurrentTimestamp(), ...data });
    }
  },

  warn: (message, data = {}) => {
    if (currentLogLevel <= LOG_LEVELS.WARN) {
      console.warn(`[WARN] ${message}`, { timestamp: getCurrentTimestamp(), ...data });
    }
  },

  error: (message, error = null, data = {}) => {
    if (currentLogLevel <= LOG_LEVELS.ERROR) {
      console.error(`[ERROR] ${message}`, {
        timestamp: getCurrentTimestamp(),
        error: error?.message || error,
        stack: error?.stack,
        ...data,
      });
    }
  },
};
