import { useEffect, useState } from 'react';

const QUERY = '(prefers-color-scheme: dark)';

/** 'light' | 'dark', following the OS setting live (so the basemap matches the UI). */
export function useColorScheme() {
  const [dark, setDark] = useState(() => window.matchMedia(QUERY).matches);

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const onChange = (e) => setDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return dark ? 'dark' : 'light';
}
