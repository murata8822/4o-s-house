// /api/verify — セッション検証 + allowlist チェック

const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: '認証トークンがありません' });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ error: 'セッションが無効です' });
  }

  // allowlist チェック
  const allowedRaw = process.env.ALLOWED_EMAILS || '';
  const allowedEmails = allowedRaw
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

  if (allowedEmails.length > 0 && !allowedEmails.includes(user.email.toLowerCase())) {
    return res.status(403).json({
      error: 'このメールアドレスは許可されていません。ALLOWED_EMAILS を確認してください。'
    });
  }

  return res.status(200).json({
    verified: true,
    email: user.email,
    model: process.env.OPENAI_MODEL || 'gpt-4o'
  });
};
