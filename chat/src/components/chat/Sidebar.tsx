'use client';

import { useState } from 'react';
import type { Conversation } from '@/types';
import { formatRelativeTime } from '@/lib/hooks';
import type { AppTheme } from '@/lib/theme';

interface SidebarProps {
  conversations: Conversation[];
  currentId: string | null;
  isOpen: boolean;
  isLoading: boolean;
  theme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
  onClose: () => void;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onPin: (id: string, pinned: boolean) => void;
  onSearch: (query: string) => void;
  onNavigate: (path: string) => void;
}

const TEXT = {
  menu: '\u30e1\u30cb\u30e5\u30fc',
  closeSidebar: '\u30b5\u30a4\u30c9\u30d0\u30fc\u3092\u9589\u3058\u308b',
  newChat: '\u65b0\u3057\u3044\u30c1\u30e3\u30c3\u30c8',
  searchChat: '\u30c1\u30e3\u30c3\u30c8\u3092\u691c\u7d22',
  album: '\u30a2\u30eb\u30d0\u30e0\uff08\u672a\u5b9f\u88c5\uff09',
  history: '\u30c1\u30e3\u30c3\u30c8\u5c65\u6b74',
  loading: '\u8aad\u307f\u8fbc\u307f\u4e2d...',
  notFound: '\u898b\u3064\u304b\u308a\u307e\u305b\u3093',
  noChats: '\u30c1\u30e3\u30c3\u30c8\u304c\u3042\u308a\u307e\u305b\u3093',
  unpin: '\u30d4\u30f3\u3092\u5916\u3059',
  pin: '\u30d4\u30f3\u7559\u3081',
  confirmDelete: '\u672c\u5f53\u306b\u524a\u9664',
  cancel: '\u30ad\u30e3\u30f3\u30bb\u30eb',
  rename: '\u540d\u524d\u5909\u66f4',
  delete: '\u524a\u9664',
  deleteTitle: '\u30c1\u30e3\u30c3\u30c8\u3092\u524a\u9664',
  deleteMessage: '\u3053\u306e\u30c1\u30e3\u30c3\u30c8\u3068\u30e1\u30c3\u30bb\u30fc\u30b8\u3092\u524a\u9664\u3057\u307e\u3059\u3002\u3053\u306e\u64cd\u4f5c\u306f\u53d6\u308a\u6d88\u305b\u307e\u305b\u3093\u3002',
  settings: '\u8a2d\u5b9a',
  theme: '\u8868\u793a\u30c6\u30fc\u30de',
  dark: '\u30c0\u30fc\u30af',
  light: '\u30e9\u30a4\u30c8',
  contrast: '\u9ad8\u30b3\u30f3\u30c8\u30e9\u30b9\u30c8',
};

const themeItems: Array<{ id: AppTheme; label: string }> = [
  { id: 'dark', label: TEXT.dark },
  { id: 'light', label: TEXT.light },
  { id: 'contrast', label: TEXT.contrast },
];

export default function Sidebar({
  conversations,
  currentId,
  isOpen,
  isLoading,
  theme,
  onThemeChange,
  onClose,
  onSelect,
  onNewChat,
  onDelete,
  onRename,
  onPin,
  onSearch,
  onNavigate,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Conversation | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch(query);
  };

  const startRename = (conv: Conversation) => {
    setRenamingId(conv.id);
    setRenameDraft(conv.title);
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameDraft('');
  };

  const submitRename = (conv: Conversation) => {
    const next = renameDraft.trim();
    if (next && next !== conv.title) {
      onRename(conv.id, next);
    }
    cancelRename();
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/45 z-40 md:hidden" onClick={onClose} />}

      <aside
        className={`fixed md:relative left-0 top-0 bottom-0 bg-[var(--sidebar-bg)] flex flex-col z-50 overflow-hidden transition-[transform,width] duration-300 ${
          isOpen
            ? 'w-[360px] translate-x-0 border-r border-[var(--border)]'
            : 'w-[360px] -translate-x-full md:translate-x-0 md:w-0 border-r-0'
        }`}
      >
        <div className="pt-6 pb-4 px-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs tracking-wide text-[var(--text-muted)] font-medium">{TEXT.menu}</div>
            <button
              onClick={onClose}
              className="md:hidden p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors"
              aria-label={TEXT.closeSidebar}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="flex justify-center pt-1">
            <button
              onClick={() => {
                onNewChat();
                if (window.matchMedia('(max-width: 767px)').matches) onClose();
              }}
              className="w-[58px] h-[58px] rounded-2xl text-[var(--text-primary)] border border-[var(--border)] bg-transparent hover:bg-[var(--surface)] active:scale-[0.985] transition-all flex items-center justify-center"
              aria-label={TEXT.newChat}
              title={TEXT.newChat}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 pb-4">
          <div className="relative">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={TEXT.searchChat}
              className="w-full h-[50px] bg-[var(--surface)] border border-[var(--border)] rounded-xl pl-11 pr-4 text-base leading-6 text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>
        </div>

        <div className="px-6 pb-3">
          <button
            onClick={() => {
              onNavigate('/album');
              if (window.matchMedia('(max-width: 767px)').matches) onClose();
            }}
            className="w-full py-4 px-4 text-left text-base leading-6 text-[var(--text-primary)] rounded-xl hover:bg-[var(--surface)] transition-colors flex items-center gap-3"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <circle cx="8.5" cy="10" r="1.5" />
              <polyline points="21,15 16,11 10,17 7,14 3,18" />
            </svg>
            {TEXT.album}
          </button>
        </div>

        <div className="menu-divider mx-5 mb-3" />
        <div className="px-6 pb-2">
          <div className="text-xs tracking-wide text-[var(--text-muted)] font-medium">{TEXT.history}</div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 scrollbar-thin">
          {isLoading && (
            <div className="flex items-center justify-center py-8 text-[var(--text-secondary)]">
              <span className="inline-block w-5 h-5 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
              <span className="ml-2 text-sm">{TEXT.loading}</span>
            </div>
          )}

          {!isLoading && conversations.length === 0 && (
            <div className="text-center text-[var(--text-secondary)] text-sm py-8">
              {searchQuery ? TEXT.notFound : TEXT.noChats}
            </div>
          )}

          {conversations.map((conv) => {
            const active = conv.id === currentId;
            const isRenaming = renamingId === conv.id;
            return (
              <div
                key={conv.id}
                onClick={() => {
                  if (isRenaming) return;
                  onSelect(conv.id);
                  if (window.matchMedia('(max-width: 767px)').matches) onClose();
                }}
                className={`group relative flex items-center gap-2 py-4 pl-5 pr-4 rounded-xl cursor-pointer mb-1 transition-colors ${
                  active
                    ? 'bg-[var(--surface)] text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-soft)]'
                }`}
              >
                {active && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-[var(--accent)]" />}

                {conv.pinned && (
                  <span className="text-[var(--accent)] text-xs flex-shrink-0">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
                    </svg>
                  </span>
                )}

                <div className="flex-1 min-w-0">
                  {isRenaming ? (
                    <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        autoFocus
                        value={renameDraft}
                        onChange={(e) => setRenameDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            submitRename(conv);
                          }
                          if (e.key === 'Escape') {
                            e.preventDefault();
                            cancelRename();
                          }
                        }}
                        className="w-full h-9 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            submitRename(conv);
                          }}
                          className="px-2.5 py-1 text-xs rounded-md bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-primary)]"
                        >
                          保存
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            cancelRename();
                          }}
                          className="px-2.5 py-1 text-xs rounded-md border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]"
                        >
                          {TEXT.cancel}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-[16px] leading-6 truncate">{conv.title}</div>
                      <div className="text-[14px] leading-5 text-[var(--text-muted)] mt-0.5">
                        {formatRelativeTime(conv.updated_at)}
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPin(conv.id, !conv.pinned);
                    }}
                    className={`w-7 h-7 rounded-md transition-colors flex items-center justify-center ${
                      conv.pinned
                        ? 'text-[var(--accent)] hover:bg-[var(--surface)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--surface)]'
                    }`}
                    title={conv.pinned ? TEXT.unpin : TEXT.pin}
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
                      if (isRenaming) {
                        cancelRename();
                        return;
                      }
                      startRename(conv);
                    }}
                    className="w-7 h-7 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors flex items-center justify-center"
                    title={TEXT.rename}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(conv);
                    }}
                    className="w-7 h-7 rounded-md text-[var(--text-secondary)] hover:text-[var(--danger)] hover:bg-[var(--surface)] transition-colors flex items-center justify-center"
                    title={TEXT.delete}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3,6 5,6 21,6" />
                      <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="menu-divider mx-5 mt-2" />
        <div className="px-6 pt-3 pb-6">
          <button
            onClick={() => {
              onNavigate('/settings');
              if (window.matchMedia('(max-width: 767px)').matches) onClose();
            }}
            className="w-full py-4 px-4 text-left text-[17px] leading-6 text-[var(--text-secondary)] rounded-xl hover:bg-[var(--surface)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            {TEXT.settings}
          </button>

          <div className="pt-3">
            <div className="text-xs tracking-wide text-[var(--text-muted)] font-medium pb-2">{TEXT.theme}</div>
            <div className="grid grid-cols-3 gap-2">
              {themeItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onThemeChange(item.id)}
                  className={`min-h-[56px] px-2 rounded-xl text-[13px] font-medium border transition-colors ${
                    theme === item.id
                      ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--surface-soft)]'
                      : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface)]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {deleteTarget && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--sidebar-bg)] p-5">
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">{TEXT.deleteTitle}</h3>
            <p className="text-sm leading-6 text-[var(--text-secondary)] mb-3">{deleteTarget.title}</p>
            <p className="text-sm leading-6 text-[var(--text-secondary)] mb-5">{TEXT.deleteMessage}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors"
              >
                {TEXT.cancel}
              </button>
              <button
                onClick={() => {
                  onDelete(deleteTarget.id);
                  setDeleteTarget(null);
                }}
                className="px-4 py-2 rounded-lg bg-[var(--danger)] text-white hover:brightness-95 transition-colors"
              >
                {TEXT.confirmDelete}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
