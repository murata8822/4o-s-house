'use client';

import type { Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
  showTimestamp: boolean;
  showModel: boolean;
  showCostDetails?: boolean;
  onCopyUserMessage?: (message: Message) => void;
  onCopyAssistantMessage?: (message: Message) => void;
  onEditUserMessage?: (message: Message) => void;
}

const TEXT = {
  attachedImage: '\u753b\u50cf\u6dfb\u4ed8',
  copy: '\u30b3\u30d4\u30fc',
  editAndRegenerate: '\u7de8\u96c6\u3057\u3066\u518d\u751f\u6210',
};

export default function MessageBubble({
  message,
  showTimestamp,
  showModel,
  showCostDetails = true,
  onCopyUserMessage,
  onCopyAssistantMessage,
  onEditUserMessage,
}: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const imageData = message.content_json
    ? ((message.content_json as Record<string, string>).imageData as string | undefined)
    : undefined;
  const hasImage = Boolean(imageData);

  return (
    <div className={`group/msg animate-fadeIn ${isUser ? 'flex justify-end' : ''}`}>
      <div className={isUser ? 'w-full max-w-[min(86%,720px)]' : 'w-full'}>
        <div className={`flex items-center gap-3 mb-1.5 ${isUser ? 'justify-end' : ''}`}>
          {!isUser && <span className="text-sm leading-5 font-medium text-[var(--accent)]">4o</span>}
          {showTimestamp && (
            <span className="text-xs leading-4 text-[var(--text-muted)]">
              {new Date(message.created_at).toLocaleTimeString('ja-JP', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
          {!isUser && showModel && message.model && (
            <span className="text-[11px] text-[var(--text-muted)] bg-[var(--surface)] px-2 py-0.5 rounded-full">
              {message.model}
            </span>
          )}
        </div>

        {hasImage && imageData && (
          <div className={`mb-2 ${isUser ? 'flex justify-end' : ''}`}>
            <img src={imageData} alt={TEXT.attachedImage} className="max-h-60 rounded-lg border border-[var(--border)]" />
          </div>
        )}

        {isUser ? (
          <div className="ml-auto rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 px-4 py-3 text-[15px] leading-6 whitespace-pre-wrap break-words text-[var(--text-primary)]">
            {message.content_text}
          </div>
        ) : (
          <div className="mr-auto rounded-2xl px-4 py-3 text-[15px] leading-6 whitespace-pre-wrap break-words text-[var(--text-primary)] max-w-[min(90%,720px)]">
            {message.content_text}
          </div>
        )}

        {isUser && (
          <div className="mt-1 flex items-center justify-end gap-1.5 opacity-0 group-hover/msg:opacity-100 transition-opacity">
            <button
              onClick={() => onCopyUserMessage?.(message)}
              className="w-7 h-7 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors flex items-center justify-center"
              title={TEXT.copy}
              aria-label={TEXT.copy}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>
            <button
              onClick={() => onEditUserMessage?.(message)}
              className="w-7 h-7 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors flex items-center justify-center"
              title={TEXT.editAndRegenerate}
              aria-label={TEXT.editAndRegenerate}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </button>
          </div>
        )}

        {!isUser && (
          <div className="mt-1 flex items-center justify-start gap-1.5 opacity-0 group-hover/msg:opacity-100 transition-opacity">
            <button
              onClick={() => onCopyAssistantMessage?.(message)}
              className="w-7 h-7 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors flex items-center justify-center"
              title={TEXT.copy}
              aria-label={TEXT.copy}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>
          </div>
        )}

        {!isUser && showCostDetails && message.cost_usd !== null && message.cost_usd > 0 && (
          <div className="text-xs text-[var(--text-muted)] mt-1">
            {message.token_input && message.token_output
              ? `${message.token_input.toLocaleString()} in / ${message.token_output.toLocaleString()} out`
              : ''}
            {message.cost_usd > 0 && ` | $${message.cost_usd.toFixed(4)}`}
          </div>
        )}
      </div>
    </div>
  );
}
