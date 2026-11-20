import { useEffect, useState } from 'react';

// Стан React, синхронізований із localStorage
export default function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? initialValue : JSON.parse(raw);
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* сховище недоступне */
    }
  }, [key, value]);

  return [value, setValue];
}
