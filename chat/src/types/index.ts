export interface User {
  id: string;
  email: string;
  display_name: string | null;
  timezone: string;
  allowlisted: boolean;
  created_at: string;
}

export interface Settings {
  user_id: string;
  default_model: ModelId;
  custom_instructions: string;
  streaming_enabled: boolean;
  timestamps_enabled: boolean;
  sound_enabled: boolean;
  memory_injection_enabled: boolean;
}

export type ModelId =
  | 'gpt-4o-2024-05-13'
  | 'gpt-4o-2024-11-20'
  | 'chatgpt-4o-latest';

export interface ModelOption {
  id: ModelId;
  label: string;
  description: string;
  inputCostPer1M: number;
  outputCostPer1M: number;
}

export const MODELS: ModelOption[] = [
  {
    id: 'gpt-4o-2024-05-13',
    label: 'GPT-4o (2024-05)',
    description: '2024春版 - 当時の雰囲気確認用',
    inputCostPer1M: 5.0,
    outputCostPer1M: 15.0,
  },
  {
    id: 'gpt-4o-2024-11-20',
    label: 'GPT-4o (2024-11)',
    description: '2024秋版 - メインモデル',
    inputCostPer1M: 2.5,
    outputCostPer1M: 10.0,
  },
  {
    id: 'chatgpt-4o-latest',
    label: 'ChatGPT-4o-latest',
    description: 'ChatGPT寄せ比較用',
    inputCostPer1M: 5.0,
    outputCostPer1M: 15.0,
  },
];

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
  started_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content_text: string;
  content_json: Record<string, unknown> | null;
  model: string | null;
  created_at: string;
  token_input: number | null;
  token_output: number | null;
  cost_usd: number | null;
}

export interface MemoryNote {
  user_id: string;
  markdown: string;
  updated_at: string;
}

export interface StreamEvent {
  type: 'text' | 'done' | 'error' | 'usage';
  content?: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
  error?: string;
}
