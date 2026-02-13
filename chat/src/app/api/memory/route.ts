import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('memory_notes')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) return NextResponse.json({ markdown: '', updated_at: null });
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { markdown } = await request.json();

  // Check size limit (8KB)
  const sizeBytes = new TextEncoder().encode(markdown || '').length;
  if (sizeBytes > 8 * 1024) {
    return NextResponse.json(
      { error: 'メモリは8KBまでです。現在: ' + Math.round(sizeBytes / 1024) + 'KB' },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from('memory_notes')
    .upsert({
      user_id: user.id,
      markdown: markdown || '',
      updated_at: new Date().toISOString(),
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
