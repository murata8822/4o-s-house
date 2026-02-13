import OpenAI from 'openai';

export function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export function buildSystemPrompt(
  customInstructions: string,
  memoryMarkdown: string | null,
  memoryEnabled: boolean,
  albumMemoryMarkdown?: string | null
): string {
  const parts: string[] = [];

  parts.push(
    'You are a warm assistant. Follow user intent carefully, keep facts clear, and avoid inventing details.'
  );

  if (customInstructions && customInstructions.trim()) {
    parts.push(`\n## User Instructions\n${customInstructions.trim()}`);
  }

  if (memoryEnabled && memoryMarkdown && memoryMarkdown.trim()) {
    const memoryContent = memoryMarkdown.trim();
    const MAX_MEMORY_BYTES = 8 * 1024;
    const truncated =
      new TextEncoder().encode(memoryContent).length > MAX_MEMORY_BYTES
        ? memoryContent.slice(0, MAX_MEMORY_BYTES) + '\n\n[Memory truncated due to size limit]'
        : memoryContent;
    parts.push(`\n## Long-term Memory\n${truncated}`);
  }

  if (albumMemoryMarkdown && albumMemoryMarkdown.trim()) {
    parts.push(`\n## Album Memory\n${albumMemoryMarkdown.trim()}`);
  }

  return parts.join('\n');
}