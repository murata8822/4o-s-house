import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Public paths that don't require auth
  const publicPaths = ['/auth', '/api/auth/callback'];
  const isPublicPath = publicPaths.some((p) => request.nextUrl.pathname.startsWith(p));

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth';
    return NextResponse.redirect(url);
  }

  // Check allowlist
  if (user && !isPublicPath) {
    const allowedEmails = (process.env.ALLOWED_EMAILS || '').split(',').map((e) => e.trim().toLowerCase());
    if (allowedEmails.length > 0 && allowedEmails[0] !== '' && !allowedEmails.includes(user.email?.toLowerCase() || '')) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = '/auth';
      url.searchParams.set('error', 'not_allowed');
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
