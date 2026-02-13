'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Conversation, Settings, Message, ModelId } from '@/types';

// Fetch settings
export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        setSettings(data.settings);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const updateSettings = async (updates: Partial<Settings>) => {
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: updates }),
    });
    if (res.ok) {
      setSettings((prev) => (prev ? { ...prev, ...updates } : null));
    }
  };

  return { settings, loading, updateSettings };
}

// Fetch conversations
export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async (search?: string) => {
    setLoading(true);
    const url = search ? `/api/conversations?search=${encodeURIComponent(search)}` : '/api/conversations';
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setConversations(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const createConversation = async (title?: string): Promise<Conversation | null> => {
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    if (res.ok) {
      const conv = await res.json();
      setConversations((prev) => [conv, ...prev]);
      return conv;
    }
    return null;
  };

  const deleteConversation = async (id: string) => {
    const res = await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setConversations((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const updateConversation = async (id: string, updates: Partial<Conversation>) => {
    const res = await fetch(`/api/conversations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const updated = await res.json();
      setConversations((prev) => prev.map((c) => (c.id === id ? updated : c)));
    }
  };

  return { conversations, loading, fetchConversations, createConversation, deleteConversation, updateConversation };
}

// Fetch messages for a conversation
export function useMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    setLoading(true);
    fetch(`/api/conversations/${conversationId}`)
      .then((r) => r.json())
      .then((data) => {
        setMessages(data.messages || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [conversationId]);

  const addMessage = async (
    msg: {
      content_text: string;
      role: string;
      content_json?: Record<string, unknown> | null;
      model?: string;
    },
    targetConversationId?: string
  ) => {
    const effectiveConversationId = targetConversationId ?? conversationId;
    if (!effectiveConversationId) return null;
    const res = await fetch(`/api/conversations/${effectiveConversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg),
    });
    if (res.ok) {
      const saved = await res.json();
      setMessages((prev) => [...prev, saved]);
      return saved;
    }
    return null;
  };

  return { messages, setMessages, loading, addMessage };
}

// Streaming hook
export function useStreaming() {
  const abortRef = useRef<AbortController | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const startStream = async (
    body: {
      conversationId: string;
      messages: Array<{ role: string; content: string; imageData?: string }>;
      model: ModelId;
      customInstructions: string;
      memoryMarkdown: string;
      memoryEnabled: boolean;
      imageData?: string;
    },
    onDelta: (text: string) => void,
    onDone: (usage?: { input_tokens: number; output_tokens: number; cost_usd: number }) => void,
    onError: (error: string) => void
  ) => {
    abortRef.current = new AbortController();
    setIsStreaming(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.text();
        onError(err);
        setIsStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        onError('No response body');
        setIsStreaming(false);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6));
              if (event.type === 'text') {
                onDelta(event.content || '');
              } else if (event.type === 'usage') {
                // Usage will be followed by done
                onDone(event.usage);
              } else if (event.type === 'done') {
                // Stream complete
              } else if (event.type === 'error') {
                onError(event.error || 'Unknown error');
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name !== 'AbortError') {
        onError(error.message);
      }
    } finally {
      setIsStreaming(false);
    }
  };

  const stopStream = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
  };

  return { isStreaming, startStream, stopStream };
}

// Elapsed time hook
export function useElapsedTime(startedAt: string | null) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    if (!startedAt) {
      setElapsed('');
      return;
    }

    const update = () => {
      const start = new Date(startedAt).getTime();
      const now = Date.now();
      const diffSec = Math.floor((now - start) / 1000);
      if (diffSec < 60) {
        setElapsed(`${diffSec}秒`);
      } else if (diffSec < 3600) {
        setElapsed(`${Math.floor(diffSec / 60)}分`);
      } else {
        const h = Math.floor(diffSec / 3600);
        const m = Math.floor((diffSec % 3600) / 60);
        setElapsed(`${h}時間${m}分`);
      }
    };

    update();
    const timer = setInterval(update, 10000);
    return () => clearInterval(timer);
  }, [startedAt]);

  return elapsed;
}

// Relative time formatter
export function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'たった今';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}分前`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}時間前`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}日前`;
  return new Date(dateStr).toLocaleDateString('ja-JP');
}
