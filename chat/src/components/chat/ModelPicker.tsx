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
      <div className="relative z-20 mx-4 mb-2">
        <div className="max-w-3xl mx-auto">
          <div className="bg-[#2f2f2f] border border-[#424242] rounded-xl p-2 shadow-xl">
            {MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => onSelect(model.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                  current === model.id
                    ? 'bg-[#10a37f]/20 text-[#10a37f]'
                    : 'text-[#ececec] hover:bg-[#424242]'
                }`}
              >
                <div className="text-sm font-medium">{model.label}</div>
                <div className="text-xs text-[#9b9b9b] mt-0.5">{model.description}</div>
                <div className="text-xs text-[#6b6b6b] mt-0.5">
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
