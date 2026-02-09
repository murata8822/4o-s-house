// /api/chat — OpenAI プロキシ（認証 + allowlist 検証付き）
// APIキーはサーバー環境変数で管理し、ブラウザには露出しない

const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // --- 認証 ---
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: '認証トークンがありません' });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'セッションが無効です' });
  }

  // --- allowlist ---
  const allowedRaw = process.env.ALLOWED_EMAILS || '';
  const allowedEmails = allowedRaw
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

  if (allowedEmails.length > 0 && !allowedEmails.includes(user.email.toLowerCase())) {
    return res.status(403).json({ error: '許可されていないメールアドレスです' });
  }

  // --- OpenAI プロキシ ---
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY が未設定です' });
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o';
  const body = {
    model,
    messages: req.body.messages || [],
    max_tokens: req.body.max_tokens || 4096
  };

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify(body)
    });

    const data = await openaiRes.json();

    if (!openaiRes.ok) {
      return res.status(openaiRes.status).json(data);
    }

    // 利用ログを記録（非同期、エラーは無視）
    if (data.usage) {
      supabase.from('usage_logs').insert({
        user_id: user.id,
        model,
        prompt_tokens: data.usage.prompt_tokens || 0,
        completion_tokens: data.usage.completion_tokens || 0,
        total_tokens: data.usage.total_tokens || 0
      }).then(() => {}).catch(() => {});
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('OpenAI proxy error:', err);
    return res.status(502).json({ error: 'OpenAI への接続に失敗しました' });
  }
};
