'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import {
  readShowCostDetails,
  readShowMessageModel,
  writeShowCostDetails,
  writeShowMessageModel,
} from '@/lib/preferences';
import { MODELS } from '@/types';
import type { Settings } from '@/types';

export default function SettingsPage() {
  const router = useRouter();

  const [settings, setSettings] = useState<Settings | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [timezone, setTimezone] = useState('');
  const [memory, setMemory] = useState('');
  const [memorySizeKB, setMemorySizeKB] = useState(0);
  const [showMessageModel, setShowMessageModel] = useState(true);
  const [showCostDetails, setShowCostDetails] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        setSettings(data.settings);
        setDisplayName(data.user?.display_name || '');
        setTimezone(data.user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
      })
      .catch(() => {});

    fetch('/api/memory')
      .then((r) => r.json())
      .then((data) => {
        const markdown = data.markdown || '';
        setMemory(markdown);
        setMemorySizeKB(new TextEncoder().encode(markdown).length / 1024);
      })
      .catch(() => {});

    setShowMessageModel(readShowMessageModel());
    setShowCostDetails(readShowCostDetails());
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);

    await Promise.all([
      fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            default_model: settings.default_model,
            custom_instructions: settings.custom_instructions,
            streaming_enabled: settings.streaming_enabled,
            timestamps_enabled: settings.timestamps_enabled,
            sound_enabled: settings.sound_enabled,
            memory_injection_enabled: settings.memory_injection_enabled,
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
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#212121] text-[#ececec] overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="text-[#9b9b9b] hover:text-[#ececec] transition-colors"
              aria-label="Back"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12,19 5,12 12,5" />
              </svg>
            </button>
            <h1 className="text-xl font-semibold">Settings</h1>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#10a37f] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1a7f64] disabled:opacity-50 active:scale-95 transition-all"
          >
            {saving ? 'Saving...' : saved ? 'Saved' : 'Save'}
          </button>
        </div>

        <section className="mb-8">
          <h2 className="text-sm font-medium text-[#9b9b9b] mb-4 uppercase tracking-wider">Profile</h2>
          <div className="bg-[#2f2f2f] rounded-xl p-4 space-y-4">
            <div>
              <label className="block text-sm text-[#9b9b9b] mb-1">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-[#171717] border border-[#424242] rounded-lg py-2 px-3 text-sm text-[#ececec] outline-none focus:border-[#10a37f] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-[#9b9b9b] mb-1">Time Zone</label>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full bg-[#171717] border border-[#424242] rounded-lg py-2 px-3 text-sm text-[#ececec] outline-none focus:border-[#10a37f] transition-colors"
              />
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-sm font-medium text-[#9b9b9b] mb-4 uppercase tracking-wider">Default Model</h2>
          <div className="bg-[#2f2f2f] rounded-xl p-2 space-y-1">
            {MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => setSettings({ ...settings, default_model: model.id })}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                  settings.default_model === model.id ? 'bg-[#10a37f]/20 text-[#10a37f]' : 'hover:bg-[#424242]'
                }`}
              >
                <div className="text-sm font-medium">{model.label}</div>
                <div className="text-xs text-[#9b9b9b]">{model.description}</div>
              </button>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-sm font-medium text-[#9b9b9b] mb-4 uppercase tracking-wider">Custom Instructions</h2>
          <div className="bg-[#2f2f2f] rounded-xl p-4">
            <textarea
              value={settings.custom_instructions}
              onChange={(e) => setSettings({ ...settings, custom_instructions: e.target.value })}
              rows={6}
              className="w-full bg-[#171717] border border-[#424242] rounded-lg py-3 px-3 text-sm text-[#ececec] placeholder-[#6b6b6b] outline-none focus:border-[#10a37f] resize-y transition-colors"
            />
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-sm font-medium text-[#9b9b9b] mb-4 uppercase tracking-wider">
            Memory ({memorySizeKB.toFixed(1)} / 8.0 KB)
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
                Inject memory into chat
              </label>
            </div>
            <textarea
              value={memory}
              onChange={(e) => {
                setMemory(e.target.value);
                setMemorySizeKB(new TextEncoder().encode(e.target.value).length / 1024);
              }}
              rows={10}
              className="w-full bg-[#171717] border border-[#424242] rounded-lg py-3 px-3 text-sm text-[#ececec] placeholder-[#6b6b6b] outline-none focus:border-[#10a37f] resize-y font-mono transition-colors"
            />
            {memorySizeKB > 8 && (
              <div className="text-xs text-red-400 mt-1">
                Memory is over 8 KB. Please reduce it before saving.
              </div>
            )}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-sm font-medium text-[#9b9b9b] mb-4 uppercase tracking-wider">Display</h2>
          <div className="bg-[#2f2f2f] rounded-xl divide-y divide-[#424242]">
            <ToggleRow
              label="Streaming"
              description="Show assistant response as it is generated"
              value={settings.streaming_enabled}
              onChange={(v) => setSettings({ ...settings, streaming_enabled: v })}
            />
            <ToggleRow
              label="Message timestamps"
              description="Show timestamp on each message"
              value={settings.timestamps_enabled}
              onChange={(v) => setSettings({ ...settings, timestamps_enabled: v })}
            />
            <ToggleRow
              label="Sound effects"
              description="Play sound on send and receive"
              value={settings.sound_enabled}
              onChange={(v) => setSettings({ ...settings, sound_enabled: v })}
            />
            <ToggleRow
              label="Message model label"
              description="Show model label on each assistant message"
              value={showMessageModel}
              onChange={(v) => {
                setShowMessageModel(v);
                writeShowMessageModel(v);
              }}
            />
            <ToggleRow
              label="Cost details"
              description="Show token/cost details under each assistant message"
              value={showCostDetails}
              onChange={(v) => {
                setShowCostDetails(v);
                writeShowCostDetails(v);
              }}
            />
          </div>
        </section>

        <section>
          <button
            onClick={handleSignOut}
            className="w-full py-3 text-red-400 bg-[#2f2f2f] rounded-xl text-sm hover:bg-[#424242] active:scale-[0.98] transition-all"
          >
            Sign out
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