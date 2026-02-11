'use client';

import { useState } from 'react';
import type { Conversation } from '@/types';
import { formatRelativeTime } from '@/lib/hooks';

interface SidebarProps {
  conversations: Conversation[];
  currentId: string | null;
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void;
  onPin: (id: string, pinned: boolean) => void;
  onSearch: (query: string) => void;
  onNavigate: (path: string) => void;
}

export default function Sidebar({
  conversations,
  currentId,
  isOpen,
  isLoading,
  onClose,
  onSelect,
  onNewChat,
  onDelete,
  onPin,
  onSearch,
  onNavigate,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    onSearch(q);
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onClose} />}

      <aside
        className={`fixed md:relative left-0 top-0 bottom-0 bg-[#171717] flex flex-col z-50 overflow-hidden transition-[transform,width] duration-300 ${
          isOpen
            ? 'w-[320px] translate-x-0 border-r border-[#424242]'
            : 'w-[320px] -translate-x-full md:translate-x-0 md:w-0 border-r-0'
        }`}
      >
        <div className="pt-4 pb-3 pl-5 pr-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs tracking-wide text-[#7f7f7f] font-medium">メニュー</div>
            <button
              onClick={onClose}
              className="md:hidden p-2 rounded-lg text-[#9b9b9b] hover:text-[#ececec] hover:bg-[#2f2f2f] transition-colors"
              aria-label="サイドバーを閉じる"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <button
            onClick={() => {
              onNewChat();
              if (window.matchMedia('(max-width: 767px)').matches) onClose();
            }}
            className="w-full py-4 px-4 bg-transparent border border-[#424242] rounded-xl text-[#ececec] text-base font-medium leading-6 flex items-center gap-3 hover:bg-[#2f2f2f] active:scale-[0.98] transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            新しいチャット
          </button>
        </div>

        <div className="pl-5 pr-4 pb-3">
          <div className="relative">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9b9b9b]"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="チャットを検索"
              className="w-full bg-[#2f2f2f] border border-[#424242] rounded-lg py-3 pl-10 pr-3 text-base leading-6 text-[#ececec] placeholder-[#9b9b9b] outline-none focus:border-[#10a37f] transition-colors"
            />
          </div>
        </div>

        <div className="px-4 pb-3">
          <button
            onClick={() => {
              onNavigate('/album');
              if (window.matchMedia('(max-width: 767px)').matches) onClose();
            }}
            className="w-full py-3.5 px-4 text-left text-base leading-6 text-[#ececec] rounded-lg hover:bg-[#2f2f2f] transition-colors flex items-center gap-3"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <circle cx="8.5" cy="10" r="1.5" />
              <polyline points="21,15 16,11 10,17 7,14 3,18" />
            </svg>
            アルバム（未実装）
          </button>
        </div>

        <div className="px-5 pb-2">
          <div className="text-xs tracking-wide text-[#7f7f7f] font-medium">チャット履歴</div>
        </div>

        <div className="flex-1 overflow-y-auto pl-4 pr-3 scrollbar-thin">
          {isLoading && (
            <div className="flex items-center justify-center py-8 text-[#9b9b9b]">
              <span className="inline-block w-5 h-5 border-2 border-[#424242] border-t-[#10a37f] rounded-full animate-spin" />
              <span className="ml-2 text-sm">読み込み中...</span>
            </div>
          )}
          {!isLoading && conversations.length === 0 && (
            <div className="text-center text-[#9b9b9b] text-sm py-8">
              {searchQuery ? '見つかりません' : 'チャットがありません'}
            </div>
          )}

          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => {
                onSelect(conv.id);
                if (window.matchMedia('(max-width: 767px)').matches) onClose();
              }}
              className={`group relative flex items-center gap-2 py-3.5 px-4 rounded-lg cursor-pointer mb-0.5 transition-colors ${
                conv.id === currentId
                  ? 'bg-[#2f2f2f] text-[#ececec]'
                  : 'text-[#9b9b9b] hover:bg-[#2f2f2f]/50'
              }`}
            >
              {conv.pinned && (
                <span className="text-[#10a37f] text-xs flex-shrink-0">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
                  </svg>
                </span>
              )}

              <div className="flex-1 min-w-0">
                <div className="text-base leading-6 truncate">{conv.title}</div>
                <div className="text-sm leading-5 text-[#6b6b6b] mt-0.5">{formatRelativeTime(conv.updated_at)}</div>
              </div>

              <div className="hidden group-hover:flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPin(conv.id, !conv.pinned);
                  }}
                  className="p-1 text-[#9b9b9b] hover:text-[#10a37f] transition-colors"
                  title={conv.pinned ? 'ピンを外す' : 'ピン留め'}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill={conv.pinned ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirmDelete === conv.id) {
                      onDelete(conv.id);
                      setConfirmDelete(null);
                    } else {
                      setConfirmDelete(conv.id);
                      setTimeout(() => setConfirmDelete(null), 3000);
                    }
                  }}
                  className={`p-1 transition-colors ${
                    confirmDelete === conv.id ? 'text-red-500' : 'text-[#9b9b9b] hover:text-red-400'
                  }`}
                  title={confirmDelete === conv.id ? '本当に削除' : '削除'}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3,6 5,6 21,6" />
                    <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-[#424242] pl-5 pr-4 py-4 space-y-2.5">
          <button
            onClick={() => {
              onNavigate('/settings');
              if (window.matchMedia('(max-width: 767px)').matches) onClose();
            }}
            className="w-full py-4 px-4 text-left text-[17px] leading-6 text-[#9b9b9b] rounded-lg hover:bg-[#2f2f2f] transition-colors flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            設定
          </button>
        </div>
      </aside>
    </>
  );
}
