-- ==============================================
-- hisui_no_hakoniwa — Supabase スキーマ
-- ==============================================
-- Supabase SQL Editor にこのファイルの内容を貼り付けて実行してください。

-- UUID 拡張
create extension if not exists "uuid-ossp";

-- ----- チャット -----
create table chats (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default '新しいチャット',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ----- メッセージ -----
create table messages (
  id uuid default uuid_generate_v4() primary key,
  chat_id uuid references chats(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz default now() not null
);

-- ----- 利用ログ（トークン集計用） -----
create table usage_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  model text not null,
  prompt_tokens integer not null default 0,
  completion_tokens integer not null default 0,
  total_tokens integer not null default 0,
  created_at timestamptz default now() not null
);

-- ==============================================
-- Row Level Security
-- ==============================================
alter table chats enable row level security;
alter table messages enable row level security;
alter table usage_logs enable row level security;

-- chats: 自分のデータのみ CRUD
create policy "Users can select own chats"
  on chats for select using (auth.uid() = user_id);
create policy "Users can insert own chats"
  on chats for insert with check (auth.uid() = user_id);
create policy "Users can update own chats"
  on chats for update using (auth.uid() = user_id);
create policy "Users can delete own chats"
  on chats for delete using (auth.uid() = user_id);

-- messages: チャット所有者のみ
create policy "Users can select own messages"
  on messages for select using (
    exists (select 1 from chats where chats.id = messages.chat_id and chats.user_id = auth.uid())
  );
create policy "Users can insert own messages"
  on messages for insert with check (
    exists (select 1 from chats where chats.id = messages.chat_id and chats.user_id = auth.uid())
  );
create policy "Users can delete own messages"
  on messages for delete using (
    exists (select 1 from chats where chats.id = messages.chat_id and chats.user_id = auth.uid())
  );

-- usage_logs: 自分の利用のみ閲覧可（挿入は API proxy が service_role で行う）
create policy "Users can select own usage"
  on usage_logs for select using (auth.uid() = user_id);

-- ==============================================
-- インデックス
-- ==============================================
create index idx_chats_user_id on chats(user_id);
create index idx_chats_updated_at on chats(updated_at desc);
create index idx_messages_chat_id on messages(chat_id);
create index idx_messages_created_at on messages(created_at);
create index idx_usage_logs_user_id on usage_logs(user_id);
create index idx_usage_logs_created_at on usage_logs(created_at);
