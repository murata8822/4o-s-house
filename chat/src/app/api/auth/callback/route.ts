import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    const errorUrl = new URL('/auth', origin);
    errorUrl.searchParams.set('error', 'auth_failed');
    errorUrl.searchParams.set('reason', error.message);
    return NextResponse.redirect(errorUrl.toString());
  }

  const errorUrl = new URL('/auth', origin);
  errorUrl.searchParams.set('error', 'auth_failed');
  errorUrl.searchParams.set('reason', 'missing_code');
  return NextResponse.redirect(errorUrl.toString());
}
