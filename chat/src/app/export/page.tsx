'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Conversation } from '@/types';

export default function ExportPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string>('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetch('/api/conversations')
      .then((r) => r.json())
      .then(setConversations)
      .catch(() => {});
  }, []);

  const handleExport = async (format: string) => {
    setExporting(true);
    try {
      let url = `/api/export?format=${format}`;
      if (format === 'markdown' && selectedConvId) {
        url += `&conversation_id=${selectedConvId}`;
      }

      const res = await fetch(url);
      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition');
      const filename = disposition?.match(/filename="(.+)"/)?.[1] || `export.${format === 'json' ? 'json' : 'md'}`;

      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      alert('エクスポートに失敗しました');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#212121] text-[#ececec] overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.push('/')}
            className="text-[#9b9b9b] hover:text-[#ececec] transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12,19 5,12 12,5" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold">エクスポート</h1>
        </div>

        <section className="mb-6">
          <div className="bg-[#2f2f2f] rounded-xl p-4">
            <h2 className="text-sm font-medium mb-2">全チャット (JSON)</h2>
            <p className="text-xs text-[#9b9b9b] mb-3">
              すべてのチャット履歴をJSON形式でダウンロードします。バックアップに最適です。
            </p>
            <button
              onClick={() => handleExport('json')}
              disabled={exporting}
              className="bg-[#10a37f] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1a7f64] disabled:opacity-50 active:scale-95 transition-all"
            >
              {exporting ? 'ダウンロード中...' : 'JSONをダウンロード'}
            </button>
          </div>
        </section>

        <section className="mb-6">
          <div className="bg-[#2f2f2f] rounded-xl p-4">
            <h2 className="text-sm font-medium mb-2">チャット (Markdown)</h2>
            <p className="text-xs text-[#9b9b9b] mb-3">
              選択したチャットをMarkdown形式でダウンロードします。
            </p>
            <select
              value={selectedConvId}
              onChange={(e) => setSelectedConvId(e.target.value)}
              className="w-full bg-[#171717] border border-[#424242] rounded-lg py-2 px-3 text-sm text-[#ececec] mb-3 outline-none focus:border-[#10a37f] transition-colors"
            >
              <option value="">チャットを選択...</option>
              {conversations.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
            <button
              onClick={() => handleExport('markdown')}
              disabled={exporting || !selectedConvId}
              className="bg-[#10a37f] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1a7f64] disabled:opacity-50 active:scale-95 transition-all"
            >
              Markdownをダウンロード
            </button>
          </div>
        </section>

        <section className="mb-6">
          <div className="bg-[#2f2f2f] rounded-xl p-4">
            <h2 className="text-sm font-medium mb-2">メモリ (Markdown)</h2>
            <p className="text-xs text-[#9b9b9b] mb-3">
              メモリノートをMarkdown形式でダウンロードします。
            </p>
            <button
              onClick={() => handleExport('memory')}
              disabled={exporting}
              className="bg-[#10a37f] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1a7f64] disabled:opacity-50 active:scale-95 transition-all"
            >
              メモリをダウンロード
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
