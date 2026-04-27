import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isProduction = import.meta.env.PROD;

const COOKIE_DOMAIN = '.speedrackms.kr';
const CHUNK_SIZE = 3500;

function getCookie(name: string): string | null {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const eqIdx = cookie.indexOf('=');
    if (eqIdx === -1) continue;
    const cName = cookie.substring(0, eqIdx).trim();
    const cValue = cookie.substring(eqIdx + 1).trim();
    if (cName === name) return cValue;
  }
  return null;
}

function setCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${value}; domain=${COOKIE_DOMAIN}; path=/; max-age=${maxAge}; secure; samesite=lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; domain=${COOKIE_DOMAIN}; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

const cookieStorage = {
  getItem: (key: string): string | null => {
    const directValue = getCookie(key);

    if (directValue && directValue !== 'chunked') {
      try { return decodeURIComponent(directValue); } catch { return directValue; }
    }

    if (directValue === 'chunked') {
      const parts: string[] = [];
      for (let i = 0; ; i++) {
        const chunk = getCookie(`${key}.${i}`);
        if (chunk === null) break;
        parts.push(chunk);
      }
      if (parts.length === 0) return null;
      try { return decodeURIComponent(parts.join('')); } catch { return parts.join(''); }
    }

    return null;
  },

  setItem: (key: string, value: string) => {
    const maxAge = 604800;
    const encoded = encodeURIComponent(value);

    for (let i = 0; ; i++) {
      if (getCookie(`${key}.${i}`) === null) break;
      deleteCookie(`${key}.${i}`);
    }

    if (encoded.length <= CHUNK_SIZE) {
      setCookie(key, encoded, maxAge);
      return;
    }

    setCookie(key, 'chunked', maxAge);
    const totalChunks = Math.ceil(encoded.length / CHUNK_SIZE);
    for (let i = 0; i < totalChunks; i++) {
      setCookie(`${key}.${i}`, encoded.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE), maxAge);
    }
  },

  removeItem: (key: string) => {
    deleteCookie(key);
    for (let i = 0; ; i++) {
      if (getCookie(`${key}.${i}`) === null) break;
      deleteCookie(`${key}.${i}`);
    }
  }
};

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL 또는 Anon Key가 없습니다. .env 파일을 확인하세요.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    ...(isProduction && { storage: cookieStorage }),
    storageKey: 'sb-speedrack-auth',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});