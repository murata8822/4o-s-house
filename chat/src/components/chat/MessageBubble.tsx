'use client';

import type { Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
  showTimestamp: boolean;
}

const TEXT = {
  you: '\u3042\u306a\u305f',
  attachedImage: '\u753b\u50cf\u6dfb\u4ed8',
};

export default function MessageBubble({ message, showTimestamp }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const hasImage = Boolean(message.content_json && (message.content_json as Record<string, string>).imageData);

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`text-base leading-6 font-medium ${
            isUser ? 'text-[var(--text-primary)]' : 'text-[var(--accent)]'
          }`}
        >
          {isUser ? TEXT.you : '4o'}
        </span>
        {showTimestamp && (
          <span className="text-sm leading-5 text-[var(--text-muted)]">
            {new Date(message.created_at).toLocaleTimeString('ja-JP', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}
        {!isUser && message.model && (
          <span className="text-xs text-[var(--text-muted)] bg-[var(--surface)] px-2 py-1 rounded-full">
            {message.model}
          </span>
        )}
      </div>

      {hasImage && (
        <div className="mb-2">
          <img
            src={(message.content_json as Record<string, string>).imageData}
            alt={TEXT.attachedImage}
            className="max-h-60 rounded-lg border border-[var(--border)]"
          />
        </div>
      )}

      <div className="text-base leading-8 whitespace-pre-wrap break-words text-[var(--text-primary)]">
        {message.content_text}
      </div>

      {!isUser && message.cost_usd !== null && message.cost_usd > 0 && (
        <div className="text-xs text-[var(--text-muted)] mt-1">
          {message.token_input && message.token_output
            ? `${message.token_input.toLocaleString()} in / ${message.token_output.toLocaleString()} out`
            : ''}
          {message.cost_usd > 0 && ` | $${message.cost_usd.toFixed(4)}`}
        </div>
      )}
    </div>
  );
}
