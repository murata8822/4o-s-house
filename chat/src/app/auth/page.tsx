'use client';

import { Suspense } from 'react';
import AuthContent from './AuthContent';

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#212121] flex items-center justify-center text-[#9b9b9b]">
          読み込み中...
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
