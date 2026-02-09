// /api/config — 公開設定を返す（認証不要）
// Supabase の URL と anon key は公開情報（RLS で保護）

module.exports = function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({
      error: 'Supabase が未設定です。環境変数 NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を設定してください。'
    });
  }

  return res.status(200).json({
    supabaseUrl,
    supabaseAnonKey,
    model: process.env.OPENAI_MODEL || 'gpt-4o'
  });
};
