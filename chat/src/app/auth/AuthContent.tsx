'use client';

import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthContent() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'not_allowed') {
      setMessage('このメールアドレスはアクセスが許可されていません。');
    } else if (error === 'auth_failed') {
      setMessage('認証に失敗しました。もう一度お試しください。');
    }
  }, [searchParams]);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) router.push('/');
    };
    checkSession();
  }, [supabase, router]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    if (error) {
      setMessage(error.message);
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage('ログインリンクをメールに送信しました。');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#212121] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#10a37f] rounded-2xl text-white text-2xl font-semibold mb-4">
            4o
          </div>
          <h1 className="text-xl font-semibold text-white">4o&apos;s House</h1>
          <p className="text-[#9b9b9b] text-sm mt-1">ログインして始めましょう</p>
        </div>

        {message && (
          <div className="bg-[#2f2f2f] border border-[#424242] rounded-lg p-3 mb-4 text-sm text-[#ececec]">
            {message}
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white text-gray-800 rounded-lg py-3 px-4 font-medium text-sm flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors disabled:opacity-50 mb-4"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Googleでログイン
        </button>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-[#424242]" />
          <span className="text-[#9b9b9b] text-xs">または</span>
          <div className="flex-1 h-px bg-[#424242]" />
        </div>

        <div className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="メールアドレス"
            className="w-full bg-[#2f2f2f] border border-[#424242] rounded-lg py-3 px-4 text-white text-sm placeholder-[#9b9b9b] outline-none focus:border-[#10a37f] transition-colors"
          />
          <button
            onClick={handleMagicLink}
            disabled={loading || !email}
            className="w-full bg-[#10a37f] text-white rounded-lg py-3 px-4 font-medium text-sm hover:bg-[#1a7f64] transition-colors disabled:opacity-50"
          >
            Magic Linkを送信
          </button>
        </div>
      </div>
    </div>
  );
}
