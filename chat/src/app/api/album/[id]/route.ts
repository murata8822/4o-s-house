import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (typeof body.comment === 'string') updates.comment = body.comment;
  if (typeof body.memoryNote === 'string') updates.memory_note = body.memoryNote;

  const { data, error } = await supabase
    .from('album_items')
    .update(updates)
    .eq('id', numericId)
    .eq('user_id', user.id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await supabase
    .from('album_items')
    .delete()
    .eq('id', numericId)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

