'use client';

import type { Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
  showTimestamp: boolean;
}

export default function MessageBubble({ message, showTimestamp }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  // Check for image in content_json
  const hasImage = message.content_json && (message.content_json as Record<string, string>).imageData;

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className={`text-sm font-medium ${
            isUser ? 'text-[#ececec]' : 'text-[#10a37f]'
          }`}
        >
          {isUser ? 'あなた' : '4o'}
        </span>
        {showTimestamp && (
          <span className="text-xs text-[#6b6b6b]">
            {new Date(message.created_at).toLocaleTimeString('ja-JP', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}
        {!isUser && message.model && (
          <span className="text-xs text-[#6b6b6b] bg-[#2f2f2f] px-2 py-0.5 rounded-full">
            {message.model}
          </span>
        )}
      </div>

      {/* Image attachment */}
      {hasImage && (
        <div className="mb-2">
          <img
            src={(message.content_json as Record<string, string>).imageData}
            alt="添付画像"
            className="max-h-60 rounded-lg border border-[#424242]"
          />
        </div>
      )}

      <div
        className={`text-[15px] leading-relaxed whitespace-pre-wrap break-words ${
          isUser ? 'text-[#ececec]' : 'text-[#ececec]'
        }`}
      >
        {message.content_text}
      </div>

      {/* Cost info for assistant messages */}
      {!isUser && message.cost_usd !== null && message.cost_usd > 0 && (
        <div className="text-xs text-[#6b6b6b] mt-1">
          {message.token_input && message.token_output
            ? `${message.token_input.toLocaleString()} in / ${message.token_output.toLocaleString()} out`
            : ''}
          {message.cost_usd > 0 && ` | $${message.cost_usd.toFixed(4)}`}
        </div>
      )}
    </div>
  );
}
