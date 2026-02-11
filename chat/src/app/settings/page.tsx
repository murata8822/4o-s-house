'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { readShowMessageModel, writeShowMessageModel } from '@/lib/preferences';
import { MODELS } from '@/types';
import type { Settings } from '@/types';

export default function SettingsPage() {
  const router = useRouter();
  // supabase is imported as singleton from @/lib/supabase/client

  const [settings, setSettings] = useState<Settings | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [timezone, setTimezone] = useState('');
  const [memory, setMemory] = useState('');
  const [memorySizeKB, setMemorySizeKB] = useState(0);
  const [showMessageModel, setShowMessageModel] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        setSettings(data.settings);
        setDisplayName(data.user?.display_name || '');
        setTimezone(data.user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
      });

    fetch('/api/memory')
      .then((r) => r.json())
      .then((data) => {
        setMemory(data.markdown || '');
        setMemorySizeKB(new TextEncoder().encode(data.markdown || '').length / 1024);
      });

    setShowMessageModel(readShowMessageModel());
  }, []);

  const handleSave = async () => {
    setSaving(true);

    await Promise.all([
      fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            default_model: settings?.default_model,
            custom_instructions: settings?.custom_instructions,
            streaming_enabled: settings?.streaming_enabled,
            timestamps_enabled: settings?.timestamps_enabled,
            sound_enabled: settings?.sound_enabled,
            memory_injection_enabled: settings?.memory_injection_enabled,
          },
          user: {
            display_name: displayName,
            timezone,
          },
        }),
      }),
      fetch('/api/memory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown: memory }),
      }),
    ]);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  if (!settings) {
    return (
      <div className="min-h-screen bg-[#212121] flex items-center justify-center text-[#9b9b9b]">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#212121] text-[#ececec] overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="text-[#9b9b9b] hover:text-[#ececec] transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12,19 5,12 12,5" />
              </svg>
            </button>
            <h1 className="text-xl font-semibold">設定</h1>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#10a37f] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1a7f64] disabled:opacity-50 active:scale-95 transition-all"
          >
            {saving ? '保存中...' : saved ? '保存済み' : '保存'}
          </button>
        </div>

        {/* Profile */}
        <section className="mb-8">
          <h2 className="text-sm font-medium text-[#9b9b9b] mb-4 uppercase tracking-wider">プロフィール</h2>
          <div className="bg-[#2f2f2f] rounded-xl p-4 space-y-4">
            <div>
              <label className="block text-sm text-[#9b9b9b] mb-1">表示名</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-[#171717] border border-[#424242] rounded-lg py-2 px-3 text-sm text-[#ececec] outline-none focus:border-[#10a37f] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-[#9b9b9b] mb-1">タイムゾーン</label>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full bg-[#171717] border border-[#424242] rounded-lg py-2 px-3 text-sm text-[#ececec] outline-none focus:border-[#10a37f] transition-colors"
              />
            </div>
          </div>
        </section>

        {/* Model */}
        <section className="mb-8">
          <h2 className="text-sm font-medium text-[#9b9b9b] mb-4 uppercase tracking-wider">既定モデル</h2>
          <div className="bg-[#2f2f2f] rounded-xl p-2 space-y-1">
            {MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => setSettings({ ...settings, default_model: model.id })}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                  settings.default_model === model.id
                    ? 'bg-[#10a37f]/20 text-[#10a37f]'
                    : 'hover:bg-[#424242]'
                }`}
              >
                <div className="text-sm font-medium">{model.label}</div>
                <div className="text-xs text-[#9b9b9b]">{model.description}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Custom Instructions */}
        <section className="mb-8">
          <h2 className="text-sm font-medium text-[#9b9b9b] mb-4 uppercase tracking-wider">ふるまい設定（Custom Instructions）</h2>
          <div className="bg-[#2f2f2f] rounded-xl p-4">
            <textarea
              value={settings.custom_instructions}
              onChange={(e) => setSettings({ ...settings, custom_instructions: e.target.value })}
              placeholder="例: 簡潔に答えてください。過度なお世辞は避けてください。日本語で回答してください。"
              rows={6}
              className="w-full bg-[#171717] border border-[#424242] rounded-lg py-3 px-3 text-sm text-[#ececec] placeholder-[#6b6b6b] outline-none focus:border-[#10a37f] resize-y transition-colors"
            />
          </div>
        </section>

        {/* Memory Notes */}
        <section className="mb-8">
          <h2 className="text-sm font-medium text-[#9b9b9b] mb-4 uppercase tracking-wider">
            メモリ ({memorySizeKB.toFixed(1)} / 8.0 KB)
          </h2>
          <div className="bg-[#2f2f2f] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.memory_injection_enabled}
                  onChange={(e) =>
                    setSettings({ ...settings, memory_injection_enabled: e.target.checked })
                  }
                  className="accent-[#10a37f]"
                />
                チャット時にメモリを注入
              </label>
            </div>
            <textarea
              value={memory}
              onChange={(e) => {
                setMemory(e.target.value);
                setMemorySizeKB(new TextEncoder().encode(e.target.value).length / 1024);
              }}
              placeholder="モデルに記憶してほしいことをMarkdownで記述..."
              rows={10}
              className="w-full bg-[#171717] border border-[#424242] rounded-lg py-3 px-3 text-sm text-[#ececec] placeholder-[#6b6b6b] outline-none focus:border-[#10a37f] resize-y font-mono transition-colors"
            />
            {memorySizeKB > 8 && (
              <div className="text-xs text-red-400 mt-1">
                メモリが8KBを超えています。保存時に切り捨てられます。
              </div>
            )}
          </div>
        </section>

        {/* Toggle Settings */}
        <section className="mb-8">
          <h2 className="text-sm font-medium text-[#9b9b9b] mb-4 uppercase tracking-wider">表示設定</h2>
          <div className="bg-[#2f2f2f] rounded-xl divide-y divide-[#424242]">
            <ToggleRow
              label="ストリーミング表示"
              description="文字を逐次表示する"
              value={settings.streaming_enabled}
              onChange={(v) => setSettings({ ...settings, streaming_enabled: v })}
            />
            <ToggleRow
              label="メッセージ時刻表示"
              description="各メッセージにタイムスタンプを表示"
              value={settings.timestamps_enabled}
              onChange={(v) => setSettings({ ...settings, timestamps_enabled: v })}
            />
            <ToggleRow
              label="効果音"
              description="送信/受信時の効果音"
              value={settings.sound_enabled}
              onChange={(v) => setSettings({ ...settings, sound_enabled: v })}
            />
            <ToggleRow
              label="モデル名表示"
              description="各アシスタント返信にモデル名を表示"
              value={showMessageModel}
              onChange={(v) => {
                setShowMessageModel(v);
                writeShowMessageModel(v);
              }}
            />
          </div>
        </section>

        {/* Sign Out */}
        <section>
          <button
            onClick={handleSignOut}
            className="w-full py-3 text-red-400 bg-[#2f2f2f] rounded-xl text-sm hover:bg-[#424242] active:scale-[0.98] transition-all"
          >
            ログアウト
          </button>
        </section>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div>
        <div className="text-sm">{label}</div>
        <div className="text-xs text-[#9b9b9b]">{description}</div>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          value ? 'bg-[#10a37f]' : 'bg-[#424242]'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
            value ? 'translate-x-5' : ''
          }`}
        />
      </button>
    </div>
  );
}
