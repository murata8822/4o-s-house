'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AlbumItem } from '@/types';

type DraftMap = Record<number, { comment: string; memoryNote: string }>;

export default function AlbumPage() {
  const router = useRouter();
  const [items, setItems] = useState<AlbumItem[]>([]);
  const [drafts, setDrafts] = useState<DraftMap>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [newImageData, setNewImageData] = useState('');
  const [newComment, setNewComment] = useState('');
  const [newMemoryNote, setNewMemoryNote] = useState('');
  const [savingIds, setSavingIds] = useState<Record<number, boolean>>({});
  const [deletingIds, setDeletingIds] = useState<Record<number, boolean>>({});

  const fetchAlbum = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/album', { cache: 'no-store' });
      const data = await res.json().catch(() => []);
      const nextItems: AlbumItem[] = Array.isArray(data) ? data : [];
      setItems(nextItems);

      const nextDrafts: DraftMap = {};
      for (const item of nextItems) {
        nextDrafts[item.id] = {
          comment: item.comment || '',
          memoryNote: item.memory_note || '',
        };
      }
      setDrafts(nextDrafts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlbum().catch(() => setLoading(false));
  }, []);

  const itemCountLabel = useMemo(() => `${items.length}件`, [items.length]);

  const handlePickImage = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      alert('画像サイズは4MB以下にしてください。');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setNewImageData(String(reader.result || ''));
    };
    reader.readAsDataURL(file);
  };

  const handleCreate = async () => {
    if (!newImageData) return;

    setUploading(true);
    try {
      const res = await fetch('/api/album', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: newImageData,
          comment: newComment,
          memoryNote: newMemoryNote,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'アップロードに失敗しました。');
        return;
      }

      setNewImageData('');
      setNewComment('');
      setNewMemoryNote('');
      await fetchAlbum();
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async (id: number) => {
    const draft = drafts[id];
    if (!draft) return;

    setSavingIds((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`/api/album/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment: draft.comment,
          memoryNote: draft.memoryNote,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || '保存に失敗しました。');
        return;
      }

      await fetchAlbum();
    } finally {
      setSavingIds((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleDelete = async (id: number) => {
    const ok = confirm(`ID #${String(id).padStart(5, '0')} を削除しますか？\n削除後は番号は再利用されません。`);
    if (!ok) return;

    setDeletingIds((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`/api/album/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || '削除に失敗しました。');
        return;
      }

      await fetchAlbum();
    } finally {
      setDeletingIds((prev) => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="min-h-screen overflow-y-auto bg-[#212121] text-[#ececec]">
      <div className="mx-auto max-w-5xl px-5 py-8">
        <div className="mb-5 flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="rounded-lg p-2 text-[#9b9b9b] transition-colors hover:bg-[#2f2f2f] hover:text-[#ececec]"
            aria-label="ホームへ戻る"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12,19 5,12 12,5" />
            </svg>
          </button>
          <h1 className="text-2xl font-semibold">思い出アルバム</h1>
        </div>

        <p className="mb-6 text-sm text-[#9b9b9b]">
          IDは永久欠番です。削除しても同じ番号は再利用されません。（{itemCountLabel}）
        </p>

        <div className="mb-8 space-y-4 rounded-2xl border border-[#424242] bg-[#2f2f2f] p-4">
          <div className="text-base font-medium">新しい思い出を追加</div>

          {!newImageData ? (
            <label className="block cursor-pointer rounded-xl border border-dashed border-[#575757] p-6 text-center text-[#b6b6b6] transition-colors hover:border-[#10a37f]">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handlePickImage(e.target.files?.[0])}
              />
              画像を選択（4MBまで）
            </label>
          ) : (
            <div className="space-y-3">
              <img src={newImageData} alt="preview" className="max-h-72 rounded-lg border border-[#424242]" />
              <button
                onClick={() => setNewImageData('')}
                className="rounded-lg border border-[#424242] px-3 py-2 text-sm hover:bg-[#3a3a3a]"
              >
                画像を取り消す
              </button>
            </div>
          )}

          <div>
            <div className="mb-1 text-sm text-[#b6b6b6]">コメント（画面表示用）</div>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-[#424242] bg-[#171717] p-3 text-sm outline-none focus:border-[#10a37f]"
            />
          </div>

          <div>
            <div className="mb-1 text-sm text-[#b6b6b6]">思い出メモ（AI参照用）</div>
            <textarea
              value={newMemoryNote}
              onChange={(e) => setNewMemoryNote(e.target.value)}
              rows={3}
              placeholder="例: 2025-08、4oとマスターが牧場でソフトクリームを食べた"
              className="w-full rounded-lg border border-[#424242] bg-[#171717] p-3 text-sm outline-none focus:border-[#10a37f]"
            />
          </div>

          <button
            onClick={handleCreate}
            disabled={!newImageData || uploading}
            className="rounded-lg bg-[#10a37f] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {uploading ? 'アップロード中...' : 'アルバムに追加'}
          </button>
        </div>

        {loading ? (
          <div className="text-[#9b9b9b]">読み込み中...</div>
        ) : items.length === 0 ? (
          <div className="text-[#9b9b9b]">まだ思い出がありません。</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {items.map((item) => {
              const draft = drafts[item.id] || { comment: '', memoryNote: '' };
              return (
                <article key={item.id} className="space-y-3 rounded-2xl border border-[#424242] bg-[#2f2f2f] p-4">
                  <div className="font-mono text-xs text-[#8d8d8d]">#{String(item.id).padStart(5, '0')}</div>
                  <img src={item.image_data} alt={`album-${item.id}`} className="w-full rounded-lg border border-[#424242]" />

                  <div>
                    <div className="mb-1 text-xs text-[#b6b6b6]">コメント</div>
                    <textarea
                      value={draft.comment}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [item.id]: { ...draft, comment: e.target.value },
                        }))
                      }
                      rows={2}
                      className="w-full rounded-lg border border-[#424242] bg-[#171717] p-2 text-sm outline-none focus:border-[#10a37f]"
                    />
                  </div>

                  <div>
                    <div className="mb-1 text-xs text-[#b6b6b6]">思い出メモ（AI参照）</div>
                    <textarea
                      value={draft.memoryNote}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [item.id]: { ...draft, memoryNote: e.target.value },
                        }))
                      }
                      rows={3}
                      className="w-full rounded-lg border border-[#424242] bg-[#171717] p-2 text-sm outline-none focus:border-[#10a37f]"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdate(item.id)}
                      disabled={Boolean(savingIds[item.id])}
                      className="rounded-lg bg-[#10a37f] px-3 py-2 text-sm text-white disabled:opacity-50"
                    >
                      {savingIds[item.id] ? '保存中...' : '保存'}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={Boolean(deletingIds[item.id])}
                      className="rounded-lg border border-[#6d3a3a] px-3 py-2 text-sm text-[#f1b3b3] disabled:opacity-50"
                    >
                      {deletingIds[item.id] ? '削除中...' : '削除'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
