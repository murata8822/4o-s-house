import OpenAI from 'openai';

export function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export function buildSystemPrompt(
  customInstructions: string,
  memoryMarkdown: string | null,
  memoryEnabled: boolean
): string {
  const parts: string[] = [];

  parts.push(
    'あなたは有能なAIアシスタントです。ユーザーの質問に正確かつ役立つ回答を提供してください。'
  );

  if (customInstructions && customInstructions.trim()) {
    parts.push(`\n## ユーザーの指示\n${customInstructions.trim()}`);
  }

  if (memoryEnabled && memoryMarkdown && memoryMarkdown.trim()) {
    const memoryContent = memoryMarkdown.trim();
    const MAX_MEMORY_BYTES = 8 * 1024;
    const truncated =
      new TextEncoder().encode(memoryContent).length > MAX_MEMORY_BYTES
        ? memoryContent.slice(0, MAX_MEMORY_BYTES) + '\n\n[メモリが上限を超えたため切り捨てられました]'
        : memoryContent;
    parts.push(`\n## ユーザーのメモリ\n${truncated}`);
  }

  return parts.join('\n');
}
