// src/hooks/useLocalStorage.js
import { useState } from 'react';

const EXPIRY_MS = 20 * 60 * 1000; // 20 minutes
const TIMESTAMP_KEY = '__storage_timestamp__';

function useLocalStorage(key, initialValue) {
  // On every hook invocation, enforce the 20‑minute expiry:
  try {
    const now = Date.now();
    const storedTs = window.localStorage.getItem(TIMESTAMP_KEY);
    if (storedTs) {
      const age = now - parseInt(storedTs, 10);
      if (age > EXPIRY_MS) {
        window.localStorage.clear();
        window.localStorage.setItem(TIMESTAMP_KEY, now.toString());
      }
    } else {
      // First time ever: stamp it
      window.localStorage.setItem(TIMESTAMP_KEY, now.toString());
    }
  } catch (err) {
    console.warn('Error checking storage expiry:', err);
  }

  // Initialize state from localStorage (or fallback to initialValue)
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item != null ? safelyParseJSON(item) : initialValue;
    } catch (error) {
      console.error(
        `Error retrieving data from localStorage for key "${key}":`,
        error
      );
      return initialValue;
    }
  });

  // A wrapped setter that writes through to localStorage
  const setValue = (value) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      // If object, stringify; otherwise store raw
      const serialized =
        valueToStore !== null && typeof valueToStore === 'object'
          ? JSON.stringify(valueToStore)
          : String(valueToStore);
      window.localStorage.setItem(key, serialized);
      setStoredValue(valueToStore);
    } catch (error) {
      console.error(
        `Error setting data in localStorage for key "${key}":`,
        error
      );
    }
  };

  // Helper to parse JSON safely
  function safelyParseJSON(json) {
    try {
      return JSON.parse(json);
    } catch {
      return json;
    }
  }

  return [storedValue, setValue];
}

export default useLocalStorage;
