import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [settingsResult, userResult] = await Promise.all([
    supabase.from('settings').select('*').eq('user_id', user.id).single(),
    supabase.from('users').select('*').eq('id', user.id).single(),
  ]);

  return NextResponse.json({
    settings: settingsResult.data,
    user: userResult.data,
  });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  // Update settings
  if (body.settings) {
    const { error } = await supabase
      .from('settings')
      .update({
        ...body.settings,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update user profile
  if (body.user) {
    const { error } = await supabase
      .from('users')
      .update(body.user)
      .eq('id', user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
