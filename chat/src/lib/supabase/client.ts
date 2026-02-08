import { createBrowserClient } from '@supabase/ssr';

// Singleton - @supabase/ssr の createBrowserClient を使う
// これにより cookie にセッションが保存され、middleware が認識できる
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
