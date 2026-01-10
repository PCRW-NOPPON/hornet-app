/**
 * Hornet AI - useLocalStorage Hook
 * Production-ready localStorage hook with error handling and sync
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { safeJsonParse, safeJsonStringify, logger } from '../utils';

/**
 * Custom hook for localStorage with cross-tab sync
 * @param {string} key - Storage key
 * @param {any} initialValue - Default value if key doesn't exist
 * @param {object} options - Configuration options
 */
export function useLocalStorage(key, initialValue, options = {}) {
  const {
    serialize = safeJsonStringify,
    deserialize = safeJsonParse,
    syncTabs = true,
  } = options;

  // Track if this is initial mount
  const isInitialMount = useRef(true);

  // Initialize state from localStorage
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item === null) {
        return initialValue;
      }
      return deserialize(item, initialValue);
    } catch (error) {
      logger.error('Failed to read from localStorage', error, { key });
      return initialValue;
    }
  });

  // Track errors
  const [error, setError] = useState(null);

  // Persist to localStorage when value changes
  useEffect(() => {
    // Skip initial mount to avoid unnecessary write
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    try {
      const serialized = serialize(storedValue);
      window.localStorage.setItem(key, serialized);
      setError(null);

      logger.debug('Persisted to localStorage', { key, size: serialized.length });
    } catch (error) {
      logger.error('Failed to write to localStorage', error, { key });
      setError(error);

      // Check if quota exceeded
      if (error.name === 'QuotaExceededError') {
        logger.warn('localStorage quota exceeded', { key });
      }
    }
  }, [key, storedValue, serialize]);

  // Sync across tabs using storage event
  useEffect(() => {
    if (!syncTabs || typeof window === 'undefined') {
      return;
    }

    const handleStorageChange = (event) => {
      if (event.key !== key || event.storageArea !== localStorage) {
        return;
      }

      try {
        const newValue = event.newValue === null
          ? initialValue
          : deserialize(event.newValue, initialValue);

        setStoredValue(newValue);
        logger.debug('Synced from another tab', { key });
      } catch (error) {
        logger.error('Failed to sync from storage event', error, { key });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, initialValue, syncTabs, deserialize]);

  // Memoized setValue function
  const setValue = useCallback((value) => {
    setStoredValue((prev) => {
      const nextValue = typeof value === 'function' ? value(prev) : value;
      return nextValue;
    });
  }, []);

  // Remove from storage
  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
      setError(null);
      logger.debug('Removed from localStorage', { key });
    } catch (error) {
      logger.error('Failed to remove from localStorage', error, { key });
      setError(error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, { error, removeValue }];
}

/**
 * Simple localStorage getter (non-reactive)
 */
export function getStorageItem(key, defaultValue = null) {
  try {
    const item = window.localStorage.getItem(key);
    return item ? safeJsonParse(item, defaultValue) : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Simple localStorage setter (non-reactive)
 */
export function setStorageItem(key, value) {
  try {
    window.localStorage.setItem(key, safeJsonStringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * Remove item from localStorage
 */
export function removeStorageItem(key) {
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get localStorage usage info
 */
export function getStorageInfo() {
  try {
    let totalSize = 0;
    const items = {};

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      const size = (key.length + value.length) * 2; // UTF-16

      items[key] = { size, sizeKB: (size / 1024).toFixed(2) };
      totalSize += size;
    }

    return {
      totalSize,
      totalSizeKB: (totalSize / 1024).toFixed(2),
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      itemCount: localStorage.length,
      items,
    };
  } catch {
    return null;
  }
}

export default useLocalStorage;
