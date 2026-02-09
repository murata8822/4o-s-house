# hisui_no_hakoniwa

**セルフホスト個人利用チャットUI** — GPT-4o との対話を、自分のインフラだけで守る。

> これは個人用セルフホストテンプレートです。作者は利用者のデータ・APIキー・会話内容を一切保持しません。すべてのデータはあなた自身の Supabase プロジェクトと Vercel 環境に閉じます。

---

## 特徴

- **APIキーをブラウザに出さない** — OpenAI APIキーはサーバー環境変数で管理、ブラウザには一切露出しない
- **Supabase 認証** — Google OAuth + Magic Link。メール allowlist で自分だけがアクセス可能
- **PWA 対応** — iPhone のホーム画面に追加してネイティブアプリ風に使える
- **ゼロトラッキング** — アナリティクス・テレメトリは一切なし
- **データ主権** — チャット履歴は自分の Supabase DB に保存。エクスポート・一括削除もUI上で可能
- **利用額の可視化** — 設定画面で今月のトークン使用量と推定コストを確認

---

## セットアップ手順

### 1. Supabase プロジェクトを作成

1. [supabase.com](https://supabase.com) でアカウント作成 → 新規プロジェクト作成
2. SQL Editor を開き、`supabase/schema.sql` の内容をすべて貼り付けて実行
3. **Settings → API** から以下をメモ：
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` キー → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` キー → `SUPABASE_SERVICE_ROLE_KEY`（**絶対に公開しないこと**）

### 2. Google OAuth を設定

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. OAuth 2.0 Client ID を作成
   - **Authorized redirect URI**: `https://<your-supabase-project>.supabase.co/auth/v1/callback`
3. Supabase ダッシュボード → **Authentication → Providers → Google**
   - Client ID / Client Secret を入力して有効化

### 3. Magic Link を設定（バックアップログイン）

1. Supabase ダッシュボード → **Authentication → Providers → Email**
2. 「Enable Email provider」を ON にする（パスワードは不要、Magic Link のみで可）
3. **Email Templates** でリダイレクトURLを確認（デフォルトで OK）

### 4. Vercel にデプロイ

1. このリポジトリを GitHub に push
2. [vercel.com](https://vercel.com) → New Project → GitHub リポジトリをインポート
3. **Root Directory** を `4o-sanctuary/4o-sanctuary` に設定
4. 環境変数を設定：

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `OPENAI_API_KEY` | OpenAI の API キー | `sk-...` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase の Project URL | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase の anon key | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase の service_role key | `eyJ...` |
| `ALLOWED_EMAILS` | 許可するメールアドレス（カンマ区切り） | `me@gmail.com` |
| `OPENAI_MODEL` | 使用モデル（省略時: gpt-4o） | `gpt-4o` |

5. Deploy をクリック

### 5. iPhone でホーム画面に追加（PWA）

1. Safari でデプロイした URL を開く
2. 共有ボタン（□に↑）をタップ
3. 「ホーム画面に追加」をタップ
4. 表示名は自動で「hisui_no_hakoniwa」になります
5. フルスクリーンのネイティブアプリのように動作します

---

## セキュリティ注意事項

### APIキーの保護
- APIキーは **サーバー環境変数** (`OPENAI_API_KEY`) でのみ管理される
- ブラウザのネットワークタブや DevTools にAPIキーが現れることはない
- `/api/chat` エンドポイントがプロキシとして動作し、サーバー側で認証・allowlist チェック後にのみ OpenAI に転送する

### アクセス制限
- `ALLOWED_EMAILS` に自分のメールアドレスを設定することで、他者のログインを防ぐ
- **デプロイURLを不用意に共有しない** — URL が分かれば誰でもログイン画面にはアクセスできる（allowlist でブロックされるが）
- Supabase の RLS (Row Level Security) により、DB上でもユーザー間のデータ分離が保証される

### UI から APIキーを入力する設計について
- デフォルトではブラウザから APIキーを入力する仕組みは **意図的に排除** している
- セルフホストの上級者向けオプションとしてユーザーごとのキー保存を追加する場合は、**必ず暗号化** と注意書きを入れること

---

## バックアップ・エクスポート・削除・復旧

### エクスポート
- 設定画面 → 「チャット履歴をエクスポート（JSON）」をタップ
- 全チャットとメッセージが JSON ファイルでダウンロードされる

### データ削除
- 設定画面 → 「すべてのデータを削除」→ 確認ダイアログで実行
- Supabase 上のチャット・メッセージ・利用ログがすべて削除される

### Supabase から直接バックアップ
- Supabase ダッシュボード → Database → Backups でポイントインタイムリカバリが利用可能（Pro プラン以上）
- SQL Editor で `SELECT * FROM chats` / `SELECT * FROM messages` を実行し、CSV エクスポートも可能

### Google がログインに使えなくなった場合の救済手順
1. **Magic Link でログイン** — ログイン画面のメールアドレス入力欄から Magic Link を送信
2. **allowlist のメールを差し替え** — Vercel の環境変数 `ALLOWED_EMAILS` を新しいメールアドレスに変更 → 再デプロイ
3. **Supabase 側の Auth 設定を更新** — Supabase ダッシュボード → Authentication → Users で、必要に応じてユーザーを確認・管理

---

## アイコンについて

`generate-icons.html` をブラウザで開くと、PWA 用のアイコンが自動生成されます。
右クリックで保存し、`icon-192.png` と `icon-512.png` として同じディレクトリに配置してください。

---

## モデルについて

デフォルトでは `gpt-4o` を使用しています。環境変数 `OPENAI_MODEL` で変更可能です。

設定画面で現在のモデルと今月の推定利用額を確認できます。料金は OpenAI の公式料金表に基づく概算です。

---

## ライセンス

**MIT License**

選定理由: テンプレートとして fork・改変・再配布を最大限自由にするため。利用者が自分のインフラで自分のデータを管理するというコンセプトに最も適した、制約の少ないライセンスです。
