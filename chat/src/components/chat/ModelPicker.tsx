'use client';

import { MODELS } from '@/types';
import type { ModelId } from '@/types';

interface ModelPickerProps {
  current: ModelId;
  onSelect: (model: ModelId) => void;
  onClose: () => void;
}

export default function ModelPicker({ current, onSelect, onClose }: ModelPickerProps) {
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="relative z-20 mx-4 sm:mx-6 mb-3">
        <div className="max-w-5xl mx-auto">
          <div className="w-[min(94vw,720px)] bg-[var(--surface)] border border-[var(--border)] rounded-xl p-2.5 shadow-xl">
            {MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => onSelect(model.id)}
                className={`w-full text-left px-3.5 py-3 rounded-lg transition-colors ${
                  current === model.id
                    ? 'bg-[var(--surface-soft)] text-[var(--accent)]'
                    : 'text-[var(--text-primary)] hover:bg-[var(--surface-soft)]'
                }`}
              >
                <div className="text-base leading-6 font-medium">{model.label}</div>
                <div className="text-sm leading-5 text-[var(--text-secondary)] mt-0.5">{model.description}</div>
                <div className="text-sm leading-5 text-[var(--text-muted)] mt-1">
                  ${model.inputCostPer1M}/1M in | ${model.outputCostPer1M}/1M out
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
