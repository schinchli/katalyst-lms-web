/**
 * Stable per-device identifier for guest interactions (e.g. quiz reviews
 * without an account). Not a secret — just an identity handle persisted in
 * localStorage so each browser/device counts as one guest.
 */
const KEY = 'katalyst-device-id';

export function getDeviceId(): string {
  if (typeof window === 'undefined') return '';
  let id = window.localStorage.getItem(KEY);
  if (!id) {
    id = window.crypto?.randomUUID?.() ?? fallbackUuid();
    window.localStorage.setItem(KEY, id);
  }
  return id;
}

function fallbackUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
