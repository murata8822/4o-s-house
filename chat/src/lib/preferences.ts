export const SHOW_MESSAGE_MODEL_STORAGE_KEY = 'chat.show_message_model';

export function readShowMessageModel(): boolean {
  if (typeof window === 'undefined') return true;
  const raw = window.localStorage.getItem(SHOW_MESSAGE_MODEL_STORAGE_KEY);
  if (raw === null) return true;
  return raw === '1';
}

export function writeShowMessageModel(value: boolean): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SHOW_MESSAGE_MODEL_STORAGE_KEY, value ? '1' : '0');
}

