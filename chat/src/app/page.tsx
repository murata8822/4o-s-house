'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useConversations, useMessages, useSettings, useStreaming } from '@/lib/hooks';
import { useTheme } from '@/lib/theme';
import {
  readShowMessageModel,
  readLastModel,
  readShowCostDetails,
  writeLastModel,
  writeShowCostDetails,
} from '@/lib/preferences';
import type { ModelId, Message, Conversation } from '@/types';
import Sidebar from '@/components/chat/Sidebar';
import ChatArea from '@/components/chat/ChatArea';

type ToastKind = 'success' | 'error' | 'info';

type ToastState = {
  id: number;
  message: string;
  kind: ToastKind;
};

export default function Home() {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentConvId, setCurrentConvId] = useState<string | null>(null);
  const [currentModel, setCurrentModel] = useState<ModelId>('gpt-4o-2024-11-20');
  const [streamingText, setStreamingText] = useState('');
  const [currentConvStartedAt, setCurrentConvStartedAt] = useState<string | null>(null);
  const [currentConvUpdatedAt, setCurrentConvUpdatedAt] = useState<string | null>(null);
  const [currentConvTitle, setCurrentConvTitle] = useState<string | null>(null);
  const [showMessageModel, setShowMessageModel] = useState(true);
  const [showCostDetails, setShowCostDetails] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const { theme, setTheme } = useTheme();

  const { settings } = useSettings();
  const {
    conversations,
    loading: conversationsLoading,
    fetchConversations,
    createConversation,
    deleteConversation,
    updateConversation,
  } = useConversations();
  const { messages, setMessages, addMessage } = useMessages(currentConvId);
  const { isStreaming, startStream, stopStream } = useStreaming();
  const [memoryData, setMemoryData] = useState<{ markdown: string } | null>(null);

  const toApiMessage = useCallback((m: Message) => {
    const imageData =
      m.content_json && (m.content_json as Record<string, string>).imageData
        ? (m.content_json as Record<string, string>).imageData
        : undefined;
    return {
      role: m.role,
      content: m.content_text,
      imageData,
    };
  }, []);

  const runAssistantStream = useCallback(
    (
      convId: string,
      apiMessages: Array<{ role: string; content: string; imageData?: string }>,
      imageData?: string
    ) => {
      setStreamingText('');

      startStream(
        {
          conversationId: convId,
          messages: apiMessages,
          model: currentModel,
          customInstructions: settings?.custom_instructions || '',
          memoryMarkdown: memoryData?.markdown || '',
          memoryEnabled: settings?.memory_injection_enabled ?? false,
          imageData,
        },
        (delta) => {
          setStreamingText((prev) => prev + delta);
        },
        () => {
          fetch(`/api/conversations/${convId}`)
            .then((r) => r.json())
            .then((data) => {
              setMessages(data.messages || []);
            })
            .catch(() => {});
          fetchConversations();
        },
        (error) => {
          setStreamingText('');
          const errorMsg: Message = {
            id: 'error-' + Date.now(),
            conversation_id: convId,
            user_id: '',
            role: 'assistant',
            content_text: `Error: ${error}`,
            content_json: null,
            model: currentModel,
            created_at: new Date().toISOString(),
            token_input: null,
            token_output: null,
            cost_usd: null,
          };
          setMessages((prev) => [...prev, errorMsg]);
        }
      );
    },
    [currentModel, settings, memoryData, startStream, setMessages, fetchConversations]
  );

  useEffect(() => {
    const last = readLastModel();
    if (last) {
      setCurrentModel(last);
      return;
    }
    if (settings?.default_model) {
      setCurrentModel(settings.default_model);
    }
  }, [settings?.default_model]);

  useEffect(() => {
    writeLastModel(currentModel);
  }, [currentModel]);

  useEffect(() => {
    setShowMessageModel(readShowMessageModel());
    setShowCostDetails(readShowCostDetails());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setSidebarOpen(window.matchMedia('(min-width: 768px)').matches);
  }, []);

  useEffect(() => {
    fetch('/api/memory')
      .then((r) => r.json())
      .then((data) => setMemoryData(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (currentConvId) {
      const conv = conversations.find((c) => c.id === currentConvId);
      if (conv) {
        setCurrentConvStartedAt(conv.started_at);
        setCurrentConvUpdatedAt(conv.updated_at);
        setCurrentConvTitle(conv.title);
      }
    } else {
      setCurrentConvStartedAt(null);
      setCurrentConvUpdatedAt(null);
      setCurrentConvTitle(null);
    }
  }, [currentConvId, conversations]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const notify = useCallback((message: string, kind: ToastKind = 'info') => {
    setToast({ id: Date.now(), message, kind });
  }, []);

  const handleToggleCostDetails = useCallback(() => {
    setShowCostDetails((prev) => {
      const next = !prev;
      writeShowCostDetails(next);
      notify(next ? '料金表示をONにしました' : '料金表示をOFFにしました', 'info');
      return next;
    });
  }, [notify]);

  const handleNewChat = useCallback(() => {
    setCurrentConvId(null);
    setStreamingText('');
  }, []);

  const handleSelectConversation = useCallback((id: string) => {
    setCurrentConvId(id);
    setStreamingText('');
  }, []);

  const handleSend = useCallback(
    async (text: string, imageData?: string) => {
      let convId = currentConvId;

      if (!convId) {
        const title = text.slice(0, 30) + (text.length > 30 ? '...' : '');
        const conv = await createConversation(title);
        if (!conv) return;
        convId = conv.id;
        setCurrentConvId(convId);
        setCurrentConvStartedAt(conv.started_at);
        setCurrentConvUpdatedAt(conv.updated_at);
        setCurrentConvTitle(conv.title);
      }

      const userMsg = await addMessage(
        {
          content_text: text,
          role: 'user',
          content_json: imageData ? { imageData } : null,
        },
        convId
      );
      if (!userMsg) return;

      if (messages.length === 0) {
        const title = text.slice(0, 30) + (text.length > 30 ? '...' : '');
        updateConversation(convId, { title });
        setCurrentConvTitle(title);
      }

      const apiMessages = [
        ...messages.map(toApiMessage),
        {
          role: 'user',
          content: text,
          imageData,
        },
      ];

      runAssistantStream(convId, apiMessages, imageData);
    },
    [currentConvId, messages, createConversation, addMessage, updateConversation, toApiMessage, runAssistantStream]
  );

  const handleEditAndRegenerate = useCallback(
    async (target: Message, text: string, imageData?: string) => {
      if (!currentConvId || target.role !== 'user') return;
      if (isStreaming) return;

      const nextText = text.trim();
      if (!nextText && !imageData) return;

      const patchRes = await fetch(`/api/conversations/${currentConvId}/messages/${target.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_text: nextText,
          content_json: imageData ? { imageData } : null,
        }),
      });
      if (!patchRes.ok) return;

      const trimRes = await fetch(`/api/conversations/${currentConvId}/messages`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ afterMessageId: target.id }),
      });
      if (!trimRes.ok) return;

      const convRes = await fetch(`/api/conversations/${currentConvId}`);
      if (!convRes.ok) return;
      const data = await convRes.json();
      const baseMessages: Message[] = data.messages || [];
      setMessages(baseMessages);

      const firstUser = baseMessages.find((m) => m.role === 'user');
      if (firstUser?.id === target.id) {
        const title = nextText.slice(0, 30) + (nextText.length > 30 ? '...' : '');
        updateConversation(currentConvId, { title });
        setCurrentConvTitle(title);
      }

      runAssistantStream(currentConvId, baseMessages.map(toApiMessage), imageData);
      fetchConversations();
    },
    [currentConvId, isStreaming, setMessages, updateConversation, runAssistantStream, toApiMessage, fetchConversations]
  );

  const handleRetry = useCallback(() => {
    if (messages.length < 2) return;
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMsg) return;

    const imageData = lastUserMsg.content_json
      ? (lastUserMsg.content_json as Record<string, string>).imageData
      : undefined;

    setMessages((prev) => {
      const idx = prev.length - 1;
      if (idx >= 0 && prev[idx].role === 'assistant') {
        return prev.slice(0, idx);
      }
      return prev;
    });

    handleSend(lastUserMsg.content_text, imageData);
  }, [messages, handleSend, setMessages]);

  return (
    <div className="relative flex h-[100dvh] bg-[var(--bg)] text-[var(--text-primary)]">
      <Sidebar
        conversations={conversations}
        currentId={currentConvId}
        isOpen={sidebarOpen}
        isLoading={conversationsLoading}
        theme={theme}
        onThemeChange={setTheme}
        onClose={() => setSidebarOpen(false)}
        onSelect={handleSelectConversation}
        onNewChat={handleNewChat}
        onDelete={(id) => {
          deleteConversation(id);
          if (id === currentConvId) {
            setCurrentConvId(null);
          }
        }}
        onRename={(id, title) => updateConversation(id, { title } as Partial<Conversation>)}
        onPin={(id, pinned) => updateConversation(id, { pinned } as Partial<Conversation>)}
        onSearch={(q) => fetchConversations(q)}
        onNotify={notify}
        onNavigate={(path) => {
          setIsNavigating(true);
          window.setTimeout(() => setIsNavigating(false), 2200);
          router.push(path);
        }}
      />

      <ChatArea
        messages={messages}
        conversationTitle={currentConvTitle}
        createdAt={currentConvStartedAt}
        updatedAt={currentConvUpdatedAt}
        showMessageModel={showMessageModel}
        showCostDetails={showCostDetails}
        isStreaming={isStreaming}
        streamingText={streamingText}
        currentModel={currentModel}
        timestampsEnabled={settings?.timestamps_enabled ?? false}
        onSend={handleSend}
        onStop={stopStream}
        onModelChange={setCurrentModel}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onToggleCostDetails={handleToggleCostDetails}
        onRetry={handleRetry}
        onEditAndRegenerate={handleEditAndRegenerate}
        onNotify={notify}
      />

      {isNavigating && (
        <div className="absolute inset-0 z-[120] bg-black/25 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
          <div className="px-4 py-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] flex items-center gap-3 shadow-xl">
            <span className="inline-block w-5 h-5 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
            <span className="text-sm text-[var(--text-secondary)]">移動中...</span>
          </div>
        </div>
      )}

      {toast && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-6 z-[140] pointer-events-none">
          <div
            key={toast.id}
            className={`px-4 py-2 rounded-xl border shadow-xl text-sm animate-fadeIn ${
              toast.kind === 'success'
                ? 'bg-[var(--surface)] border-[var(--accent)] text-[var(--text-primary)]'
                : toast.kind === 'error'
                  ? 'bg-[var(--surface)] border-[var(--danger)] text-[var(--text-primary)]'
                  : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)]'
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
