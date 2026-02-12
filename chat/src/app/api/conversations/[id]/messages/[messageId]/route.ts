import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  const { id, messageId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const updates: Record<string, unknown> = {};
  if (body.content_text !== undefined) updates.content_text = body.content_text;
  if (body.content_json !== undefined) updates.content_json = body.content_json;

  const { data, error } = await supabase
    .from('messages')
    .update(updates)
    .eq('id', messageId)
    .eq('conversation_id', id)
    .eq('user_id', user.id)
    .eq('role', 'user')
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
