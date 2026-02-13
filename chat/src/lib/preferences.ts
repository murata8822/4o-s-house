export const SHOW_MESSAGE_MODEL_STORAGE_KEY = 'chat.show_message_model';
export const LAST_MODEL_STORAGE_KEY = 'chat.last_model';
export const SHOW_COST_DETAILS_STORAGE_KEY = 'chat.show_cost_details';

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

export function readShowCostDetails(): boolean {
  if (typeof window === 'undefined') return true;
  const raw = window.localStorage.getItem(SHOW_COST_DETAILS_STORAGE_KEY);
  if (raw === null) return true;
  return raw === '1';
}

export function writeShowCostDetails(value: boolean): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SHOW_COST_DETAILS_STORAGE_KEY, value ? '1' : '0');
}

export function readLastModel():
  | 'gpt-4o-2024-05-13'
  | 'gpt-4o-2024-11-20'
  | 'chatgpt-4o-latest'
  | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(LAST_MODEL_STORAGE_KEY);
  if (!raw) return null;
  if (
    raw === 'gpt-4o-2024-05-13' ||
    raw === 'gpt-4o-2024-11-20' ||
    raw === 'chatgpt-4o-latest'
  ) {
    return raw;
  }
  return null;
}

export function writeLastModel(
  value: 'gpt-4o-2024-05-13' | 'gpt-4o-2024-11-20' | 'chatgpt-4o-latest'
): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LAST_MODEL_STORAGE_KEY, value);
}
