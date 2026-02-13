import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const format = request.nextUrl.searchParams.get('format') || 'json';
  const conversationId = request.nextUrl.searchParams.get('conversation_id');

  if (format === 'json') {
    // Export all conversations as JSON
    let convQuery = supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (conversationId) {
      convQuery = convQuery.eq('id', conversationId);
    }

    const { data: conversations } = await convQuery;

    const result = [];
    for (const conv of conversations || []) {
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: true });

      result.push({
        ...conv,
        messages: messages || [],
      });
    }

    return new Response(JSON.stringify(result, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="4o-house-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  }

  if (format === 'markdown' && conversationId) {
    const { data: conv } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single();

    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    let md = `# ${conv?.title || 'Chat'}\n\n`;
    md += `Created: ${conv?.created_at}\n\n---\n\n`;

    for (const msg of messages || []) {
      const role = msg.role === 'user' ? 'You' : 'Assistant';
      md += `### ${role}\n\n${msg.content_text}\n\n---\n\n`;
    }

    return new Response(md, {
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': `attachment; filename="${(conv?.title || 'chat').replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/g, '_')}.md"`,
      },
    });
  }

  if (format === 'memory') {
    const { data } = await supabase
      .from('memory_notes')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return new Response(data?.markdown || '', {
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': 'attachment; filename="memory.md"',
      },
    });
  }

  return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
}
