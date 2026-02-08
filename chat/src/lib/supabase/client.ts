import { createBrowserClient } from '@supabase/ssr';

// Singleton - @supabase/ssr の createBrowserClient を使う
// これにより cookie にセッションが保存され、middleware が認識できる
// implicit flow: Supabase が #access_token をURLハッシュで返す
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      flowType: 'implicit',
      detectSessionInUrl: true,
    },
  }
);
