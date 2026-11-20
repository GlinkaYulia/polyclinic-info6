import { useEffect, useState } from 'react';

// Стан React, синхронізований із sessionStorage (дані зникають після закриття вкладки)
export default function useSessionStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = sessionStorage.getItem(key);
      return raw === null ? initialValue : JSON.parse(raw);
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* сховище недоступне */
    }
  }, [key, value]);

  return [value, setValue];
}
