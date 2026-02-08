import { createBrowserClient } from '@supabase/ssr';

// Singleton - @supabase/ssr の createBrowserClient を使う
// これにより cookie にセッションが保存され、middleware が認識できる
// PKCE flow: OAuth は /api/auth/callback で code を exchange する
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      flowType: 'pkce',
    },
  }
);
