import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const year = request.nextUrl.searchParams.get('year') || new Date().getFullYear().toString();
  const month = request.nextUrl.searchParams.get('month') || (new Date().getMonth() + 1).toString();

  const startDate = new Date(parseInt(year), parseInt(month) - 1, 1).toISOString();
  const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59).toISOString();

  // Get all messages for the month with costs
  const { data: messages, error } = await supabase
    .from('messages')
    .select('model, token_input, token_output, cost_usd, created_at')
    .eq('user_id', user.id)
    .eq('role', 'assistant')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Aggregate by model
  const modelBreakdown: Record<string, { tokens_in: number; tokens_out: number; cost: number; count: number }> = {};
  const dailyBreakdown: Record<string, number> = {};
  let totalCost = 0;

  for (const msg of messages || []) {
    const m = msg.model || 'unknown';
    if (!modelBreakdown[m]) {
      modelBreakdown[m] = { tokens_in: 0, tokens_out: 0, cost: 0, count: 0 };
    }
    modelBreakdown[m].tokens_in += msg.token_input || 0;
    modelBreakdown[m].tokens_out += msg.token_output || 0;
    modelBreakdown[m].cost += parseFloat(String(msg.cost_usd || 0));
    modelBreakdown[m].count += 1;
    totalCost += parseFloat(String(msg.cost_usd || 0));

    const day = new Date(msg.created_at).toISOString().split('T')[0];
    dailyBreakdown[day] = (dailyBreakdown[day] || 0) + parseFloat(String(msg.cost_usd || 0));
  }

  return NextResponse.json({
    totalCost,
    modelBreakdown,
    dailyBreakdown,
    year: parseInt(year),
    month: parseInt(month),
  });
}
