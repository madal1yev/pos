import { useState, useCallback, useEffect } from 'react';

export const useDarkMode = () => {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('pos_dark_mode');
    return saved === 'true';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const toggle = useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      localStorage.setItem('pos_dark_mode', next.toString());
      return next;
    });
  }, []);

  return { dark, toggle };
};
