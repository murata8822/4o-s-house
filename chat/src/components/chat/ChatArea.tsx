'use client';

import { useState, useRef, useEffect } from 'react';
import type { Message, ModelId } from '@/types';
import { MODELS } from '@/types';
import MessageBubble from './MessageBubble';
import ModelPicker from './ModelPicker';

interface ChatAreaProps {
  messages: Message[];
  conversationTitle: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  isStreaming: boolean;
  streamingText: string;
  currentModel: ModelId;
  timestampsEnabled: boolean;
  onSend: (text: string, imageData?: string) => void;
  onStop: () => void;
  onModelChange: (model: ModelId) => void;
  onToggleSidebar: () => void;
  onRetry: () => void;
}

const TEXT = {
  toggleSidebar: '\u30b5\u30a4\u30c9\u30d0\u30fc\u3092\u958b\u9589',
  created: '\u4f5c\u6210',
  updated: '\u66f4\u65b0',
  emptySub: '\u4f55\u3067\u3082\u805e\u3044\u3066\u304f\u3060\u3055\u3044',
  imageTooLarge: '\u753b\u50cf\u306f20MB\u4ee5\u4e0b\u306b\u3057\u3066\u304f\u3060\u3055\u3044',
  stop: '\u505c\u6b62',
  retry: '\u518d\u751f\u6210',
  inputPlaceholder: '\u30e1\u30c3\u30bb\u30fc\u30b8\u3092\u5165\u529b...',
  attachImage: '\u753b\u50cf\u3092\u6dfb\u4ed8',
};

export default function ChatArea({
  messages,
  conversationTitle,
  createdAt,
  updatedAt,
  isStreaming,
  streamingText,
  currentModel,
  timestampsEnabled,
  onSend,
  onStop,
  onModelChange,
  onToggleSidebar,
  onRetry,
}: ChatAreaProps) {
  const [inputText, setInputText] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatMetaDate = (iso: string) =>
    new Date(iso).toLocaleString('ja-JP', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  useEffect(() => {
    // Avoid forced scrolling while assistant text is streaming.
    if (isStreaming) return;
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 220)}px`;
  }, [inputText]);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text && !imagePreview) return;
    if (isStreaming) return;

    onSend(text, imagePreview || undefined);
    setInputText('');
    setImagePreview(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return;
    if (e.nativeEvent.isComposing) return;

    // Keep newline behavior on mobile keyboards (coarse pointer).
    const isCoarsePointer =
      typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
    const isShortcutSend = e.ctrlKey || e.metaKey;

    if (isShortcutSend || (!isCoarsePointer && !e.shiftKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      alert(TEXT.imageTooLarge);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const modelLabel = MODELS.find((m) => m.id === currentModel)?.label || currentModel;
  const hasMessages = messages.length > 0 || Boolean(streamingText);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg)] text-[var(--text-primary)]">
      <header className="flex items-center gap-3 px-8 md:px-10 py-4 border-b border-[var(--border)]">
        <button
          onClick={onToggleSidebar}
          className="text-[var(--text-primary)] p-2.5 rounded-lg active:scale-95 transition-transform hover:bg-[var(--surface)]"
          aria-label={TEXT.toggleSidebar}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <button
          onClick={() => setShowModelPicker((prev) => !prev)}
          className="glass-pill text-white min-w-[230px] sm:min-w-[280px] max-w-[68vw] sm:max-w-none px-5 py-2 rounded-full text-[18px] font-semibold leading-6 hover:brightness-105 active:scale-95 transition-all text-left truncate"
        >
          {modelLabel}
        </button>

        <div className="hidden md:flex items-center gap-4 ml-auto min-w-0">
          {conversationTitle && (
            <div className="text-base leading-6 text-[var(--text-secondary)] truncate max-w-[360px] text-right">
              {conversationTitle}
            </div>
          )}
          {(createdAt || updatedAt) && (
            <div className="text-[11px] leading-4 text-[var(--text-muted)] text-right whitespace-nowrap">
              {createdAt && (
                <div>
                  {TEXT.created}: {formatMetaDate(createdAt)}
                </div>
              )}
              {updatedAt && (
                <div>
                  {TEXT.updated}: {formatMetaDate(updatedAt)}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {showModelPicker && (
        <ModelPicker
          current={currentModel}
          onSelect={(m) => {
            onModelChange(m);
            setShowModelPicker(false);
          }}
          onClose={() => setShowModelPicker(false)}
        />
      )}

      <div className="flex-1 overflow-y-auto px-8 md:px-10 py-7">
        {!hasMessages && (
          <div className="h-full flex flex-col items-center justify-center text-[var(--text-secondary)] -translate-y-[-10px]">
            <div className="w-16 h-16 bg-[var(--accent)] rounded-2xl flex items-center justify-center text-white text-2xl font-semibold mb-4">
              4o
            </div>
            <div className="text-xl text-[var(--text-primary)] mb-2">4o&apos;s House</div>
            <div className="text-sm">{TEXT.emptySub}</div>
          </div>
        )}

        <div className="max-w-5xl mx-auto space-y-7">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} showTimestamp={timestampsEnabled} />
          ))}

          {isStreaming && (
            <div className="animate-fadeIn">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base font-medium text-[var(--accent)]">4o</span>
              </div>
              <div className="text-base leading-8 text-[var(--text-primary)] whitespace-pre-wrap">
                {streamingText || (
                  <div className="flex gap-1 py-2">
                    <span className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce [animation-delay:-0.32s]" />
                    <span className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce [animation-delay:-0.16s]" />
                    <span className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce" />
                  </div>
                )}
                <span className="inline-block w-0.5 h-5 bg-[var(--accent)] animate-pulse ml-0.5 align-text-bottom" />
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      <div className="input-area px-8 md:px-10 pb-4 pt-2.5 bg-[var(--bg)]">
        <div className="max-w-5xl mx-auto">
          {imagePreview && (
            <div className="mb-2 relative inline-block">
              <img src={imagePreview} alt="Preview" className="h-20 rounded-lg border border-[var(--border)]" />
              <button
                onClick={() => setImagePreview(null)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-[var(--surface)] rounded-full text-white text-sm flex items-center justify-center hover:bg-red-500 transition-colors"
              >
                x
              </button>
            </div>
          )}

          {isStreaming && (
            <div className="flex justify-center mb-2">
              <button
                onClick={onStop}
                className="px-5 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-full text-base leading-6 text-[var(--text-primary)] hover:bg-[var(--surface-soft)] active:scale-95 transition-all"
              >
                {TEXT.stop}
              </button>
            </div>
          )}

          {!isStreaming && messages.length > 0 && messages[messages.length - 1]?.role === 'assistant' && (
            <div className="flex justify-center mb-2">
              <button
                onClick={onRetry}
                className="px-5 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-full text-base leading-6 text-[var(--text-secondary)] hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)] active:scale-95 transition-all"
              >
                {TEXT.retry}
              </button>
            </div>
          )}

          <div className="relative">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={TEXT.inputPlaceholder}
              rows={1}
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl py-4 pl-7 pr-28 text-base leading-7 text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent)] resize-none min-h-[58px] max-h-[220px] transition-colors"
            />

            <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-10 h-10 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-90 transition-all rounded-lg hover:bg-[var(--surface-soft)]"
                title={TEXT.attachImage}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21,15 16,10 5,21" />
                </svg>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />

              <button
                onClick={handleSend}
                disabled={(!inputText.trim() && !imagePreview) || isStreaming}
                className="w-10 h-10 glass-icon-btn rounded-lg flex items-center justify-center text-white disabled:opacity-30 disabled:grayscale hover:brightness-105 active:scale-90 transition-all"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22,2 15,22 11,13 2,9 22,2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
