import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getOpenAIClient, buildSystemPrompt } from '@/lib/openai';
import { MODELS } from '@/types';
import { NextRequest } from 'next/server';
import type OpenAI from 'openai';

export const runtime = 'nodejs';
export const maxDuration = 60;

type ResponseInput = OpenAI.Responses.ResponseInput;
type EasyInputMessage = OpenAI.Responses.EasyInputMessage;

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const body = await request.json();
  const {
    conversationId,
    messages,
    model,
    customInstructions,
    memoryMarkdown,
    memoryEnabled,
    imageData,
  } = body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return new Response('Messages required', { status: 400 });
  }

  const selectedModel = model || 'gpt-4o-2024-11-20';
  const modelInfo = MODELS.find((m) => m.id === selectedModel);
  if (!modelInfo) {
    return new Response('Invalid model', { status: 400 });
  }

  const openai = getOpenAIClient();
  const systemPrompt = buildSystemPrompt(
    customInstructions || '',
    memoryMarkdown || null,
    memoryEnabled ?? false
  );

  // Build input messages for Responses API using EasyInputMessage format
  const input: ResponseInput = [];

  for (const msg of messages) {
    if (msg.role === 'user' || msg.role === 'assistant') {
      if (msg.role === 'user' && msg.imageData) {
        // Message with image
        const easyMsg: EasyInputMessage = {
          role: 'user',
          content: [
            { type: 'input_text' as const, text: msg.content || '' },
            {
              type: 'input_image' as const,
              image_url: msg.imageData,
              detail: 'auto' as const,
            },
          ],
        };
        input.push(easyMsg);
      } else {
        const easyMsg: EasyInputMessage = {
          role: msg.role as 'user' | 'assistant',
          content: msg.content || '',
        };
        input.push(easyMsg);
      }
    }
  }

  // Handle latest message with image attachment
  if (imageData && input.length > 0) {
    const lastMsg = input[input.length - 1];
    if ('role' in lastMsg && lastMsg.role === 'user' && typeof lastMsg.content === 'string') {
      (lastMsg as EasyInputMessage).content = [
        { type: 'input_text' as const, text: lastMsg.content as string },
        {
          type: 'input_image' as const,
          image_url: imageData,
          detail: 'auto' as const,
        },
      ];
    }
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await openai.responses.create({
          model: selectedModel,
          instructions: systemPrompt,
          input,
          stream: true,
        });

        let fullText = '';
        let inputTokens = 0;
        let outputTokens = 0;

        for await (const event of response) {
          if (event.type === 'response.output_text.delta') {
            const delta = event.delta || '';
            fullText += delta;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'text', content: delta })}\n\n`)
            );
          } else if (event.type === 'response.completed') {
            inputTokens = event.response?.usage?.input_tokens || 0;
            outputTokens = event.response?.usage?.output_tokens || 0;
          }
        }

        // Calculate cost
        const costInput = (inputTokens / 1_000_000) * modelInfo.inputCostPer1M;
        const costOutput = (outputTokens / 1_000_000) * modelInfo.outputCostPer1M;
        const totalCost = costInput + costOutput;

        // Save assistant message to DB
        if (conversationId) {
          await supabase.from('messages').insert({
            conversation_id: conversationId,
            user_id: user.id,
            role: 'assistant',
            content_text: fullText,
            model: selectedModel,
            token_input: inputTokens,
            token_output: outputTokens,
            cost_usd: totalCost,
          });
        }

        // Send usage info
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'usage',
              usage: {
                input_tokens: inputTokens,
                output_tokens: outputTokens,
                cost_usd: totalCost,
              },
            })}\n\n`
          )
        );

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
        controller.close();
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'error', error: errorMessage })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
