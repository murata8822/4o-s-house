'use client';

import { useState, useRef, useEffect } from 'react';
import type { Message, ModelId } from '@/types';
import { MODELS } from '@/types';
import { useElapsedTime } from '@/lib/hooks';
import MessageBubble from './MessageBubble';
import ModelPicker from './ModelPicker';

interface ChatAreaProps {
  messages: Message[];
  conversationTitle: string | null;
  startedAt: string | null;
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

export default function ChatArea({
  messages,
  conversationTitle,
  startedAt,
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
  const elapsed = useElapsedTime(startedAt);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
    }
  }, [inputText]);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text && !imagePreview) return;
    if (isStreaming) return;

    onSend(text, imagePreview || undefined);
    setInputText('');
    setImagePreview(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      alert('画像は20MB以下にしてください');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const modelLabel = MODELS.find((m) => m.id === currentModel)?.label || currentModel;

  const hasMessages = messages.length > 0 || streamingText;

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#212121]">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 py-3.5 border-b border-[#424242]">
        <button
          onClick={onToggleSidebar}
          className="md:hidden text-[#ececec] p-2 rounded-lg active:scale-95 transition-transform hover:bg-[#2f2f2f]"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <button
          onClick={() => setShowModelPicker(!showModelPicker)}
          className="bg-[#10a37f] text-white px-4 py-1.5 rounded-full text-sm font-medium leading-5 hover:bg-[#1a7f64] active:scale-95 transition-all"
        >
          {modelLabel}
        </button>

        {startedAt && elapsed && (
          <div className="hidden sm:flex items-center gap-2 text-sm leading-5 text-[#9b9b9b]">
            <span>
              開始 {new Date(startedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span>/ 経過 {elapsed}</span>
          </div>
        )}

        {conversationTitle && (
          <div className="flex-1 text-base leading-6 text-[#9b9b9b] truncate text-right">
            {conversationTitle}
          </div>
        )}
      </header>

      {/* Model Picker Dropdown */}
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

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-7">
        {!hasMessages && (
          <div className="h-full flex flex-col items-center justify-center text-[#9b9b9b]">
            <div className="w-16 h-16 bg-[#10a37f] rounded-2xl flex items-center justify-center text-white text-2xl font-semibold mb-4">
              4o
            </div>
            <div className="text-xl text-[#ececec] mb-2">4o&apos;s House</div>
            <div className="text-sm">何でも聞いてください</div>
          </div>
        )}

        <div className="max-w-4xl mx-auto space-y-7">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              showTimestamp={timestampsEnabled}
            />
          ))}

          {/* Streaming message */}
          {isStreaming && (
            <div className="animate-fadeIn">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base font-medium text-[#10a37f]">4o</span>
              </div>
              <div className="text-base leading-8 text-[#ececec] whitespace-pre-wrap">
                {streamingText || (
                  <div className="flex gap-1 py-2">
                    <span className="w-2 h-2 bg-[#10a37f] rounded-full animate-bounce [animation-delay:-0.32s]" />
                    <span className="w-2 h-2 bg-[#10a37f] rounded-full animate-bounce [animation-delay:-0.16s]" />
                    <span className="w-2 h-2 bg-[#10a37f] rounded-full animate-bounce" />
                  </div>
                )}
                <span className="inline-block w-0.5 h-5 bg-[#10a37f] animate-pulse ml-0.5 align-text-bottom" />
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="input-area px-5 pb-4 pt-2.5 bg-[#212121]">
        <div className="max-w-4xl mx-auto">
          {/* Image Preview */}
          {imagePreview && (
            <div className="mb-2 relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="h-20 rounded-lg border border-[#424242]"
              />
              <button
                onClick={() => setImagePreview(null)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-[#424242] rounded-full text-white text-sm flex items-center justify-center hover:bg-red-500 transition-colors"
              >
                x
              </button>
            </div>
          )}

          {/* Stop / Retry buttons */}
          {isStreaming && (
            <div className="flex justify-center mb-2">
              <button
                onClick={onStop}
                className="px-5 py-2 bg-[#2f2f2f] border border-[#424242] rounded-full text-base leading-6 text-[#ececec] hover:bg-[#424242] active:scale-95 transition-all"
              >
                Stop generating
              </button>
            </div>
          )}
          {!isStreaming && messages.length > 0 && messages[messages.length - 1]?.role === 'assistant' && (
            <div className="flex justify-center mb-2">
              <button
                onClick={onRetry}
                className="px-5 py-2 bg-[#2f2f2f] border border-[#424242] rounded-full text-base leading-6 text-[#9b9b9b] hover:bg-[#424242] hover:text-[#ececec] active:scale-95 transition-all"
              >
                再生成
              </button>
            </div>
          )}

          <div className="relative">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="メッセージを入力..."
              rows={1}
              className="w-full bg-[#2f2f2f] border border-[#424242] rounded-2xl py-4 pl-5 pr-28 text-base leading-7 text-[#ececec] placeholder-[#9b9b9b] outline-none focus:border-[#10a37f] resize-none min-h-[58px] max-h-[220px] transition-colors"
            />
            <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5">
              {/* Image attach button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-10 h-10 flex items-center justify-center text-[#9b9b9b] hover:text-[#ececec] active:scale-90 transition-all rounded-lg hover:bg-[#424242]"
                title="画像を添付"
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

              {/* Send button */}
              <button
                onClick={handleSend}
                disabled={(!inputText.trim() && !imagePreview) || isStreaming}
                className="w-10 h-10 bg-[#10a37f] rounded-lg flex items-center justify-center text-white disabled:opacity-40 hover:bg-[#1a7f64] active:scale-90 transition-all"
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
