'use client';

import { useState, useRef, useEffect } from 'react';
import type { Message, ModelId } from '@/types';
import { MODELS } from '@/types';
import MessageBubble from './MessageBubble';
import ModelPicker from './ModelPicker';

interface ChatAreaProps {
  messages: Message[];
  conversationDisplayId?: string | null;
  conversationTitle: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  showMessageModel: boolean;
  showCostDetails: boolean;
  isStreaming: boolean;
  streamingText: string;
  currentModel: ModelId;
  timestampsEnabled: boolean;
  onSend: (text: string, imageData?: string) => void | Promise<void>;
  onStop: () => void;
  onModelChange: (model: ModelId) => void;
  onToggleSidebar: () => void;
  onToggleCostDetails: () => void;
  onRetry: () => void;
  onEditAndRegenerate?: (target: Message, text: string, imageData?: string) => Promise<void> | void;
  onNotify?: (message: string, kind?: 'success' | 'error' | 'info') => void;
}

const TEXT = {
  toggleSidebar: '\u30b5\u30a4\u30c9\u30d0\u30fc\u3092\u958b\u9589',
  created: '\u4f5c\u6210',
  updated: '\u66f4\u65b0',
  copyConversation: '\u4f1a\u8a71\u3092\u5168\u6587\u30b3\u30d4\u30fc',
  toggleCostOn: '\u6599\u91d1\u8868\u793a\u3092OFF',
  toggleCostOff: '\u6599\u91d1\u8868\u793a\u3092ON',
  emptySub: '\u4f55\u3067\u3082\u805e\u3044\u3066\u304f\u3060\u3055\u3044',
  imageTooLarge: '\u753b\u50cf\u306f20MB\u4ee5\u4e0b\u306b\u3057\u3066\u304f\u3060\u3055\u3044',
  stop: '\u505c\u6b62',
  retry: '\u518d\u751f\u6210',
  inputPlaceholder: '\u30e1\u30c3\u30bb\u30fc\u30b8\u3092\u5165\u529b...',
  attachImage: '\u753b\u50cf\u3092\u6dfb\u4ed8',
  attachFromLibrary: '\u5199\u771f\u30e9\u30a4\u30d6\u30e9\u30ea',
  attachFromCamera: '\u30ab\u30e1\u30e9',
  voiceInput: '\u97f3\u58f0\u5165\u529b',
  composerSmaller: '\u5165\u529b\u6b04\u3092\u7e2e\u5c0f',
  composerLarger: '\u5165\u529b\u6b04\u3092\u62e1\u5927',
  cheerPrompt: '\u5143\u6c17\u30c1\u30e3\u30fc\u30b8',
  cheerPromptInserted: '\u5fdc\u63f4\u30d7\u30ed\u30f3\u30d7\u30c8\u3092\u8ffd\u52a0\u3057\u307e\u3057\u305f',
  editingMode: '\u7de8\u96c6\u30e2\u30fc\u30c9\uff1a\u9001\u4fe1\u3067\u518d\u751f\u6210',
  cancelEdit: '\u7de8\u96c6\u3092\u3084\u3081\u308b',
  copied: '\u30b3\u30d4\u30fc\u3057\u307e\u3057\u305f',
  copyFailed: '\u30b3\u30d4\u30fc\u306b\u5931\u6557\u3057\u307e\u3057\u305f',
  conversationCopied: '\u4f1a\u8a71\u3092\u30b3\u30d4\u30fc\u3057\u307e\u3057\u305f',
  imageAttached: '\u753b\u50cf\u3092\u6dfb\u4ed8\u3057\u307e\u3057\u305f',
};

const COMPOSER_MIN_HEIGHT = 84;
const COMPOSER_MAX_HEIGHT = 300;
const COMPOSER_STEP = 36;
const CHEER_PROMPTS = [
  '\u3044\u307e\u306e\u79c1\u306e\u6c17\u5206\u306b\u5408\u308f\u305b\u3066\u3001\u77ed\u3044\u5143\u6c17\u56de\u5fa9\u30e1\u30c3\u30bb\u30fc\u30b8\u3092\u4e00\u3064\u304f\u3060\u3055\u3044\u3002',
  '\u3044\u307e\u306e\u79c1\u304c\u300c\u6b21\u306e10\u5206\u300d\u3060\u3051\u9032\u3081\u308b\u3088\u3046\u306b\u3001\u3068\u3066\u3082\u5c0f\u3055\u3044\u884c\u52d5\u30923\u3064\u3060\u3051\u51fa\u3057\u3066\u3002',
  '\u512a\u3057\u3081\u3067\u3001\u629c\u3044\u3066\u6df1\u547c\u5438\u3067\u304d\u308b\u3088\u3046\u306a\u4e00\u8a00\u3092\u304f\u3060\u3055\u3044\u3002',
  '\u3082\u3046\u4e00\u9811\u5f35\u308a\u3059\u304e\u306a\u3044\u3067\u6e08\u3080\u3088\u3046\u306b\u3001\u4eca\u65e5\u306e\u304a\u3057\u307e\u3044\u30eb\u30fc\u30eb\u3092\u4f5c\u3063\u3066\u3002',
];

export default function ChatArea({
  messages,
  conversationDisplayId,
  conversationTitle,
  createdAt,
  updatedAt,
  showMessageModel,
  showCostDetails,
  isStreaming,
  streamingText,
  currentModel,
  timestampsEnabled,
  onSend,
  onStop,
  onModelChange,
  onToggleSidebar,
  onToggleCostDetails,
  onRetry,
  onEditAndRegenerate,
  onNotify,
}: ChatAreaProps) {
  const [inputText, setInputText] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [composerHeight, setComposerHeight] = useState(108);
  const [cheerNotice, setCheerNotice] = useState(false);
  const [lastCheerIndex, setLastCheerIndex] = useState<number | null>(null);
  const [inputOverlayHeight, setInputOverlayHeight] = useState(192);
  const [editingTarget, setEditingTarget] = useState<Message | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const speechRef = useRef<{ stop: () => void } | null>(null);
  const cheerTimerRef = useRef<number | null>(null);
  const inputAreaRef = useRef<HTMLDivElement>(null);

  const formatMetaDate = (iso: string) =>
    new Date(iso).toLocaleString('ja-JP', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  // Intentionally no auto-scroll to avoid motion; user controls scroll position.

  useEffect(() => {
    const raw = window.localStorage.getItem('chat.composer.height');
    if (!raw) return;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return;
    setComposerHeight(Math.max(COMPOSER_MIN_HEIGHT, Math.min(COMPOSER_MAX_HEIGHT, parsed)));
  }, []);

  useEffect(() => {
    window.localStorage.setItem('chat.composer.height', String(composerHeight));
  }, [composerHeight]);

  useEffect(() => {
    const node = inputAreaRef.current;
    if (!node) return;

    const measure = () => {
      setInputOverlayHeight(node.getBoundingClientRect().height);
    };
    measure();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(measure);
      observer.observe(node);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [composerHeight, imagePreview, isStreaming, messages.length, showAttachMenu, cheerNotice]);

  useEffect(() => {
    return () => {
      if (cheerTimerRef.current !== null) {
        window.clearTimeout(cheerTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!editingTarget) return;
    const stillExists = messages.some((m) => m.id === editingTarget.id);
    if (!stillExists) {
      setEditingTarget(null);
    }
  }, [messages, editingTarget]);

  const readImageFile = (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      alert(TEXT.imageTooLarge);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
      onNotify?.(TEXT.imageAttached, 'info');
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text && !imagePreview) return;
    if (isStreaming) return;
    if (isSubmitting) return;

    setIsSubmitting(true);

    const sendingText = text;
    const sendingImage = imagePreview || undefined;
    setInputText('');
    setImagePreview(null);

    try {
      if (editingTarget && onEditAndRegenerate) {
        await onEditAndRegenerate(editingTarget, sendingText, sendingImage);
        setEditingTarget(null);
        return;
      }

      await onSend(sendingText, sendingImage);
    } finally {
      setIsSubmitting(false);
    }
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
    readImageFile(file);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(e.clipboardData?.items || []);
    const imageItem = items.find((item) => item.type.startsWith('image/'));
    if (!imageItem) return;
    const file = imageItem.getAsFile();
    if (!file) return;
    e.preventDefault();
    readImageFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    const hasFile = Array.from(e.dataTransfer?.types || []).includes('Files');
    if (!hasFile) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = Array.from(e.dataTransfer?.files || []).find((f) => f.type.startsWith('image/'));
    setIsDragOver(false);
    if (!file) return;
    readImageFile(file);
  };

  const handleCopyUserMessage = async (msg: Message) => {
    try {
      await navigator.clipboard.writeText(msg.content_text || '');
      onNotify?.(TEXT.copied, 'success');
    } catch {
      onNotify?.(TEXT.copyFailed, 'error');
    }
  };

  const handleCopyAssistantMessage = async (msg: Message) => {
    try {
      await navigator.clipboard.writeText(msg.content_text || '');
      onNotify?.(TEXT.copied, 'success');
    } catch {
      onNotify?.(TEXT.copyFailed, 'error');
    }
  };

  const handleCopyConversation = async () => {
    const fullText = messages
      .map((m) => `${m.role === 'user' ? 'User' : '4o'}:\n${m.content_text || ''}`)
      .join('\n\n');

    if (!fullText.trim()) return;
    try {
      await navigator.clipboard.writeText(fullText);
      onNotify?.(TEXT.conversationCopied, 'success');
    } catch {
      onNotify?.(TEXT.copyFailed, 'error');
    }
  };

  const handleEditUserMessage = (msg: Message) => {
    setEditingTarget(msg);
    setInputText(msg.content_text || '');
    const img = msg.content_json
      ? ((msg.content_json as Record<string, string>).imageData as string | undefined)
      : undefined;
    setImagePreview(img || null);
    setTimeout(() => {
      textareaRef.current?.focus();
      const len = (msg.content_text || '').length;
      textareaRef.current?.setSelectionRange(len, len);
    }, 0);
  };

  const handleToggleVoice = () => {
    if (isListening) {
      speechRef.current?.stop();
      setIsListening(false);
      return;
    }

    type SpeechCtor = new () => {
      lang: string;
      interimResults: boolean;
      continuous: boolean;
      onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
      onend: (() => void) | null;
      onerror: (() => void) | null;
      start: () => void;
      stop: () => void;
    };
    const w = window as Window & {
      webkitSpeechRecognition?: SpeechCtor;
      SpeechRecognition?: SpeechCtor;
    };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.lang = 'ja-JP';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      if (!transcript) return;
      setInputText((prev) => {
        if (!prev) return transcript;
        return `${prev}\n${transcript}`;
      });
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.start();
    speechRef.current = recognition;
    setIsListening(true);
  };

  const handleCheerPrompt = () => {
    if (!CHEER_PROMPTS.length) return;
    let nextIndex = Math.floor(Math.random() * CHEER_PROMPTS.length);
    if (CHEER_PROMPTS.length > 1 && nextIndex === lastCheerIndex) {
      nextIndex = (nextIndex + 1) % CHEER_PROMPTS.length;
    }
    setLastCheerIndex(nextIndex);
    const nextPrompt = CHEER_PROMPTS[nextIndex];
    setInputText((prev) => (prev ? `${prev}\n${nextPrompt}` : nextPrompt));
    setShowAttachMenu(false);
    setCheerNotice(true);
    if (cheerTimerRef.current !== null) {
      window.clearTimeout(cheerTimerRef.current);
    }
    cheerTimerRef.current = window.setTimeout(() => setCheerNotice(false), 1400);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      const len = textareaRef.current?.value.length ?? 0;
      textareaRef.current?.setSelectionRange(len, len);
    });
  };

  const supportsSpeech =
    typeof window !== 'undefined' &&
    (Boolean((window as Window & { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition) ||
      Boolean((window as Window & { SpeechRecognition?: unknown }).SpeechRecognition));

  const modelLabel = MODELS.find((m) => m.id === currentModel)?.label || currentModel;
  const hasMessages = messages.length > 0 || Boolean(streamingText);
  const decreaseComposer = () =>
    setComposerHeight((prev) => Math.max(COMPOSER_MIN_HEIGHT, prev - COMPOSER_STEP));
  const increaseComposer = () =>
    setComposerHeight((prev) => Math.min(COMPOSER_MAX_HEIGHT, prev + COMPOSER_STEP));

  return (
    <div className="relative flex-1 flex flex-col min-w-0 bg-[var(--bg)] text-[var(--text-primary)]">
      <header className="flex items-center gap-3 px-4 md:px-6 py-3 border-b border-[var(--border)]">
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
          className="glass-pill text-white max-w-[68vw] sm:max-w-none px-5 py-2 rounded-full text-[15px] font-semibold leading-5 hover:brightness-105 active:scale-95 transition-all text-left truncate"
        >
          {modelLabel}
        </button>

        <div className="hidden md:flex items-center gap-2 ml-auto min-w-0">
          <button
            onClick={handleCopyConversation}
            className="h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)] transition-colors"
            title={TEXT.copyConversation}
            aria-label={TEXT.copyConversation}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>
          <button
            onClick={onToggleCostDetails}
            className="h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)] transition-colors"
            title={showCostDetails ? TEXT.toggleCostOn : TEXT.toggleCostOff}
            aria-label={showCostDetails ? TEXT.toggleCostOn : TEXT.toggleCostOff}
          >
            $
          </button>
          {conversationTitle && (
            <div className="text-base leading-6 text-[var(--text-secondary)] truncate max-w-[360px] text-right">
              {conversationTitle}
            </div>
          )}
          {conversationDisplayId && (
            <div className="text-[11px] leading-4 text-[var(--text-muted)] font-mono whitespace-nowrap">
              #{conversationDisplayId}
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

      <div
        className="flex-1 overflow-y-auto px-4 md:px-6 pt-5"
        style={{ paddingBottom: `${Math.max(inputOverlayHeight + 24, 160)}px` }}
      >
        {!hasMessages && (
          <div className="h-full flex flex-col items-center justify-center text-[var(--text-secondary)] -translate-y-[-10px]">
            <div className="w-16 h-16 bg-[var(--accent)] rounded-2xl flex items-center justify-center text-white text-2xl font-semibold mb-4">
              4o
            </div>
            <div className="text-xl text-[var(--text-primary)] mb-2">4o&apos;s House</div>
            <div className="text-sm">{TEXT.emptySub}</div>
          </div>
        )}

        <div className="max-w-3xl mx-auto space-y-5">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              showTimestamp={timestampsEnabled}
              showModel={showMessageModel}
              showCostDetails={showCostDetails}
              onCopyUserMessage={handleCopyUserMessage}
              onCopyAssistantMessage={handleCopyAssistantMessage}
              onEditUserMessage={handleEditUserMessage}
            />
          ))}

          {isStreaming && (
            <div className="animate-fadeIn">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base font-medium text-[var(--accent)]">4o</span>
              </div>
              <div className="text-base leading-5 text-[var(--text-primary)] whitespace-pre-wrap">
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

        </div>
      </div>

      <div
        ref={inputAreaRef}
        className="input-area absolute inset-x-0 bottom-0 px-4 md:px-6 pb-4 pt-3 bg-gradient-to-t from-[var(--bg)] from-80% via-[var(--bg)]/90 to-transparent pointer-events-none"
      >
        <div className="max-w-3xl mx-auto pointer-events-auto">
          <div className="mb-2 flex items-center justify-between gap-2">
            <button
              onClick={handleCheerPrompt}
              className="h-8 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)] transition-colors flex items-center gap-1.5 text-xs"
              title={TEXT.cheerPrompt}
              aria-label={TEXT.cheerPrompt}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3l2.6 5.3L20 9l-4 3.8.9 5.2L12 15.8 7.1 18l.9-5.2L4 9l5.4-.7L12 3z" />
              </svg>
              <span>{TEXT.cheerPrompt}</span>
            </button>
            <div className="flex items-center gap-1.5">
              {editingTarget && (
                <button
                  onClick={() => {
                    setEditingTarget(null);
                    setInputText('');
                    setImagePreview(null);
                  }}
                  className="h-8 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)] transition-colors flex items-center gap-1.5 text-xs"
                  title={TEXT.cancelEdit}
                  aria-label={TEXT.cancelEdit}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  <span>{TEXT.cancelEdit}</span>
                </button>
              )}
            </div>
          </div>
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

          <div
            className={`relative ${isDragOver ? 'ring-2 ring-[var(--accent)] rounded-2xl' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {cheerNotice && (
              <div className="absolute right-2 bottom-[calc(100%+8px)] z-30 px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--text-secondary)] shadow-md animate-fadeIn">
                {TEXT.cheerPromptInserted}
              </div>
            )}
            {editingTarget && (
              <div className="absolute left-2 bottom-[calc(100%+8px)] z-20 px-3 py-1.5 rounded-full border border-[var(--accent)] bg-[var(--surface)] text-xs text-[var(--accent)] shadow-md animate-fadeIn">
                {TEXT.editingMode}
              </div>
            )}
            {showAttachMenu && (
              <div className="absolute left-2 bottom-[54px] z-30 min-w-[176px] rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-xl">
                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                    setShowAttachMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-[var(--text-primary)] hover:bg-[var(--surface-soft)]"
                >
                  {TEXT.attachFromLibrary}
                </button>
                <button
                  onClick={() => {
                    cameraInputRef.current?.click();
                    setShowAttachMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-[var(--text-primary)] hover:bg-[var(--surface-soft)]"
                >
                  {TEXT.attachFromCamera}
                </button>
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onPaste={handlePaste}
              onKeyDown={handleKeyDown}
              placeholder={TEXT.inputPlaceholder}
              rows={1}
              style={{ height: `${composerHeight}px` }}
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl pt-3 pb-12 pl-12 pr-28 text-base leading-6 text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent)] resize-none transition-colors"
            />

            <div className="absolute left-2.5 bottom-2.5">
              <button
                onClick={() => setShowAttachMenu((prev) => !prev)}
                className="w-10 h-10 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-90 transition-all rounded-lg hover:bg-[var(--surface-soft)]"
                title={TEXT.attachImage}
                aria-label={TEXT.attachImage}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15V6a2 2 0 0 0-2-2h-9" />
                  <path d="M3 9v9a2 2 0 0 0 2 2h9" />
                  <line x1="15" y1="3" x2="15" y2="9" />
                  <line x1="12" y1="6" x2="18" y2="6" />
                </svg>
              </button>
            </div>

            <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5">
              <button
                onClick={handleToggleVoice}
                disabled={!supportsSpeech}
                className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${
                  isListening
                    ? 'text-[var(--accent)] bg-[var(--surface-soft)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-soft)]'
                } disabled:opacity-35 disabled:cursor-not-allowed`}
                title={TEXT.voiceInput}
                aria-label={TEXT.voiceInput}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1v11" />
                  <path d="M8 5a4 4 0 0 1 8 0v3a4 4 0 0 1-8 0V5Z" />
                  <path d="M5 10a7 7 0 0 0 14 0" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageSelect}
                className="hidden"
              />

              <button
                onClick={handleSend}
                disabled={(!inputText.trim() && !imagePreview) || isStreaming || isSubmitting}
                className="w-10 h-10 glass-icon-btn rounded-lg flex items-center justify-center text-white disabled:opacity-30 disabled:grayscale hover:brightness-105 active:scale-90 transition-all"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
