# 4o's House

ChatGPTに似せた自分専用Webチャットアプリ。OpenAI API（Responses API）経由でGPT-4oモデルと会話できます。

## 技術スタック

- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Next.js Route Handlers (SSEストリーミング)
- **Auth/DB**: Supabase (Auth + Postgres)
- **AI**: OpenAI Responses API
- **Hosting**: Vercel (想定)
- **PWA**: iPhone Safari 最適化

## 機能

- 3つのGPT-4oモデルを切替可能
- SSEストリーミングによるリアルタイム文字表示
- 会話履歴のDB保存・検索
- 画像添付送信
- メモリノート（Custom Instructions + Memory）
- 使用量・コスト追跡
- JSON/Markdownエクスポート
- Google OAuth / Magic Link認証
- メールアドレスallowlist
- PWA（ホーム画面追加対応）

## ローカル起動手順

### 1. 依存関係インストール

```bash
cd chat
npm install
```

### 2. 環境変数設定

```bash
cp .env.local.example .env.local
```

`.env.local` を編集:

```
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ALLOWED_EMAILS=your@email.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Supabase設定

1. [Supabase](https://supabase.com) でプロジェクト作成
2. SQL Editor で `supabase/migration.sql` を実行
3. Authentication > Providers で Google OAuth を有効化
4. Authentication > URL Configuration で Redirect URL に `http://localhost:3000/api/auth/callback` を追加

### 4. 起動

```bash
npm run dev
```

http://localhost:3000 でアクセス

## デプロイ手順 (Vercel + Supabase)

1. GitHubリポジトリにpush
2. Vercelでインポート
3. Environment Variablesに `.env.local` の内容を設定
4. Supabase の Redirect URL に Vercel のドメインを追加:
   `https://your-app.vercel.app/api/auth/callback`
5. デプロイ

## PWAアイコン

`public/icons/generate.html` をブラウザで開いてアイコンを生成し、
`icon-192.png` と `icon-512.png` として保存してください。

## DB構成

| テーブル | 説明 |
|---------|------|
| users | ユーザープロフィール |
| settings | ユーザー設定（モデル、Custom Instructions等） |
| conversations | チャット一覧 |
| messages | メッセージ（トークン数・コスト含む） |
| memory_notes | メモリノート |
| attachments | 添付ファイル |
| comparisons | 比較モード（Phase 3） |

## フェーズ

- **Phase 1 (実装済)**: 認証、チャット、ストリーミング、履歴、設定、メモリ、Usage、エクスポート、PWA
- **Phase 2**: 横並び比較モード、自動メモリ候補
- **Phase 3**: ChatGPTエクスポートインポート、会話サマリ圧縮
