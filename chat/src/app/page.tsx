'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useConversations, useMessages, useSettings, useStreaming } from '@/lib/hooks';
import { useTheme } from '@/lib/theme';
import { readShowMessageModel } from '@/lib/preferences';
import type { ModelId, Message, Conversation } from '@/types';
import Sidebar from '@/components/chat/Sidebar';
import ChatArea from '@/components/chat/ChatArea';

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

  // Load settings defaults
  useEffect(() => {
    if (settings?.default_model) {
      setCurrentModel(settings.default_model);
    }
  }, [settings]);

  useEffect(() => {
    setShowMessageModel(readShowMessageModel());
  }, []);

  // Default sidebar state: open on desktop, closed on mobile.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setSidebarOpen(window.matchMedia('(min-width: 768px)').matches);
  }, []);

  // Load memory
  useEffect(() => {
    fetch('/api/memory')
      .then((r) => r.json())
      .then((data) => setMemoryData(data))
      .catch(() => {});
  }, []);

  // Load conversation details when selected
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

      // Create new conversation if needed
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

      // Save user message
      const userMsg = await addMessage(
        {
          content_text: text,
          role: 'user',
          content_json: imageData ? { imageData } : null,
        },
        convId
      );

      if (!userMsg) return;

      // Auto-generate title from first message
      if (messages.length === 0) {
        const title = text.slice(0, 30) + (text.length > 30 ? '...' : '');
        updateConversation(convId, { title });
        setCurrentConvTitle(title);
      }

      // Build message history for API
      const apiMessages = [
        ...messages.map((m: Message) => ({
          role: m.role,
          content: m.content_text,
          imageData: m.content_json && (m.content_json as Record<string, string>).imageData
            ? (m.content_json as Record<string, string>).imageData
            : undefined,
        })),
        {
          role: 'user' as const,
          content: text,
          imageData,
        },
      ];

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
        // onDelta
        (delta) => {
          setStreamingText((prev) => prev + delta);
        },
        // onDone
        () => {
          // Re-fetch messages from DB, then clear streaming text to avoid UI flicker.
          fetch(`/api/conversations/${convId}`)
            .then((r) => r.json())
            .then((data) => {
              setMessages(data.messages || []);
              setStreamingText('');
            })
            .catch(() => {
              setStreamingText('');
            });
          fetchConversations();
        },
        // onError
        (error) => {
          setStreamingText('');
          const errorMsg: Message = {
            id: 'error-' + Date.now(),
            conversation_id: convId!,
            user_id: '',
            role: 'assistant',
            content_text: `エラーが発生しました: ${error}`,
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
    [currentConvId, currentModel, messages, settings, memoryData, createConversation, addMessage, startStream, setMessages, fetchConversations, updateConversation]
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
    <div className="flex h-[100dvh] bg-[var(--bg)] text-[var(--text-primary)]">
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
        onNavigate={(path) => router.push(path)}
      />

      <ChatArea
        messages={messages}
        conversationTitle={currentConvTitle}
        createdAt={currentConvStartedAt}
        updatedAt={currentConvUpdatedAt}
        showMessageModel={showMessageModel}
        isStreaming={isStreaming}
        streamingText={streamingText}
        currentModel={currentModel}
        timestampsEnabled={settings?.timestamps_enabled ?? false}
        onSend={handleSend}
        onStop={stopStream}
        onModelChange={setCurrentModel}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onRetry={handleRetry}
      />
    </div>
  );
}
