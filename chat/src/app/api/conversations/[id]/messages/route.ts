import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: id,
      user_id: user.id,
      role: body.role || 'user',
      content_text: body.content_text || '',
      content_json: body.content_json || null,
      model: body.model || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const afterMessageId = typeof body.afterMessageId === 'string' ? body.afterMessageId : null;
  if (!afterMessageId) {
    return NextResponse.json({ error: 'afterMessageId is required' }, { status: 400 });
  }

  const { data: allMessages, error: listError } = await supabase
    .from('messages')
    .select('id')
    .eq('conversation_id', id)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (listError) return NextResponse.json({ error: listError.message }, { status: 500 });

  const index = (allMessages || []).findIndex((m) => m.id === afterMessageId);
  if (index === -1) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 });
  }

  const idsToDelete = (allMessages || []).slice(index + 1).map((m) => m.id);
  if (idsToDelete.length === 0) {
    return NextResponse.json({ deleted: 0 });
  }

  const { error: deleteError } = await supabase
    .from('messages')
    .delete()
    .in('id', idsToDelete)
    .eq('user_id', user.id);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
  return NextResponse.json({ deleted: idsToDelete.length });
}
