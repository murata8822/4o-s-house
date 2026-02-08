'use client';

import { supabase } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthContent() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const router = useRouter();
  const searchParams = useSearchParams();

  // URLの ?error= を表示
  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'not_allowed') {
      setMessage('このメールアドレスはアクセスが許可されていません。');
    } else if (error === 'auth_failed') {
      setMessage('認証に失敗しました。もう一度お試しください。');
    } else {
      // 余計なエラーが残ってたら消す
      // setMessage('');
    }
  }, [searchParams]);

  // すでにログイン済みならトップへ
  useEffect(() => {
    // Listen for auth state changes (handles implicit flow with #access_token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.push('/');
      }
    });

    // Also check if already signed in
    const checkSession = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) router.push('/');
    };
    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // ★ Step2: ここを /auth にする
        redirectTo: `${window.location.origin}/auth`,
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
    setMessage('');

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // ★ Step2: ここも /auth にする
        emailRedirectTo: `${window.location.origin}/auth`,
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
