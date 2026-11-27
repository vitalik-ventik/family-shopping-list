import { FirebaseConfig } from '../types';

export interface PairingPayload {
  apiKey: string;
  projectId: string;
  appId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  authDomain?: string;
  groupId: string;
  mode?: 'firebase' | 'demo';
}

function toBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(base64url: string): string {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export function buildPairingPayload(config: FirebaseConfig): PairingPayload {
  return {
    apiKey: config.apiKey || '',
    projectId: config.projectId || '',
    appId: config.appId || '',
    storageBucket: config.storageBucket || '',
    messagingSenderId: config.messagingSenderId || '',
    authDomain: config.authDomain || '',
    groupId: config.groupId?.trim() || 'my-family',
    mode: config.mode || 'firebase',
  };
}

export function buildPairingUrl(config: FirebaseConfig): string {
  const payload = buildPairingPayload(config);
  const encoded = toBase64Url(JSON.stringify(payload));
  if (typeof window !== 'undefined' && window.location.origin.startsWith('http')) {
    const base = `${window.location.origin}${window.location.pathname}`;
    return `${base}?fc=${encoded}`;
  }
  return JSON.stringify(payload);
}

export function parsePairingTokenFromUrl(): PairingPayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('fc');
    if (!token) return null;

    const decoded = fromBase64Url(token);
    const parsed = JSON.parse(decoded) as Partial<PairingPayload>;
    if (!parsed || typeof parsed !== 'object') return null;

    return {
      apiKey: parsed.apiKey || '',
      projectId: parsed.projectId || '',
      appId: parsed.appId || '',
      storageBucket: parsed.storageBucket || '',
      messagingSenderId: parsed.messagingSenderId || '',
      authDomain: parsed.authDomain || '',
      groupId: parsed.groupId?.trim() || 'my-family',
      mode: parsed.apiKey && parsed.projectId ? 'firebase' : parsed.mode || 'demo',
    };
  } catch {
    return null;
  }
}
