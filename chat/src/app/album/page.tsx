'use client';

import { useRouter } from 'next/navigation';

export default function AlbumPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#212121] text-[#ececec] overflow-y-auto">
      <div className="max-w-2xl mx-auto px-5 py-8">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.push('/')}
            className="text-[#9b9b9b] hover:text-[#ececec] transition-colors p-2 rounded-lg hover:bg-[#2f2f2f]"
            aria-label="戻る"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12,19 5,12 12,5" />
            </svg>
          </button>
          <h1 className="text-2xl font-semibold">アルバム</h1>
        </div>

        <div className="bg-[#2f2f2f] border border-[#424242] rounded-2xl p-6">
          <div className="text-lg font-medium mb-2">準備中</div>
          <p className="text-[#9b9b9b] leading-7">
            ここに画像や思い出メモを保存できるようにする予定です。
          </p>
        </div>
      </div>
    </div>
  );
}
