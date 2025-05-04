import { useState } from 'react';

function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      // If item exists, try to parse it. If parsing fails, return the raw item.
      return item ? safelyParseJSON(item) : initialValue;
    } catch (error) {
      console.error(`Error retrieving data from localStorage for key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      // Save to local storage.  If the value is an object, stringify it.
      window.localStorage.setItem(key, typeof valueToStore === 'object' ? JSON.stringify(valueToStore) : valueToStore);
      // Save state
      setStoredValue(valueToStore);
    } catch (error) {
      console.error(`Error setting data in localStorage for key "${key}":`, error);
    }
  };

  //Helper function to safely parse JSON
  function safelyParseJSON(json) {
    try {
      return JSON.parse(json);
    } catch (e) {
      return json; // If it's not JSON, return the raw value
    }
  }

  return [storedValue, setValue];
}

export default useLocalStorage;