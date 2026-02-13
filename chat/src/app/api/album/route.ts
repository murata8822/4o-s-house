import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('album_items')
    .select('*')
    .eq('user_id', user.id)
    .order('id', { ascending: false })
    .limit(300);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const imageData = typeof body.imageData === 'string' ? body.imageData : '';
  const comment = typeof body.comment === 'string' ? body.comment : '';
  const memoryNote = typeof body.memoryNote === 'string' ? body.memoryNote : '';

  if (!imageData.startsWith('data:image/')) {
    return NextResponse.json({ error: 'imageData is required' }, { status: 400 });
  }

  const bytes = new TextEncoder().encode(imageData).length;
  if (bytes > 4 * 1024 * 1024) {
    return NextResponse.json({ error: 'Image is too large (max 4MB after encoding)' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('album_items')
    .insert({
      user_id: user.id,
      image_data: imageData,
      comment,
      memory_note: memoryNote,
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

