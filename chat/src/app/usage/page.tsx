'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UsageData {
  totalCost: number;
  modelBreakdown: Record<string, { tokens_in: number; tokens_out: number; cost: number; count: number }>;
  dailyBreakdown: Record<string, number>;
  year: number;
  month: number;
}

export default function UsagePage() {
  const router = useRouter();
  const [data, setData] = useState<UsageData | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/usage?year=${year}&month=${month}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [year, month]);

  const prevMonth = () => {
    if (month === 1) {
      setYear(year - 1);
      setMonth(12);
    } else {
      setMonth(month - 1);
    }
  };

  const nextMonth = () => {
    if (month === 12) {
      setYear(year + 1);
      setMonth(1);
    } else {
      setMonth(month + 1);
    }
  };

  const JPY_RATE = 150;

  return (
    <div className="min-h-screen bg-[#212121] text-[#ececec] overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.push('/')}
            className="text-[#9b9b9b] hover:text-[#ececec] transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12,19 5,12 12,5" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold">使用量</h1>
        </div>

        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="text-[#9b9b9b] hover:text-[#ececec] p-2 active:scale-90 transition-all">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15,18 9,12 15,6" />
            </svg>
          </button>
          <span className="text-lg font-medium">{year}年{month}月</span>
          <button onClick={nextMonth} className="text-[#9b9b9b] hover:text-[#ececec] p-2 active:scale-90 transition-all">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9,6 15,12 9,18" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="text-center text-[#9b9b9b] py-12">読み込み中...</div>
        ) : data ? (
          <>
            <div className="bg-[#2f2f2f] rounded-xl p-6 mb-6 text-center">
              <div className="text-sm text-[#9b9b9b] mb-1">今月の合計</div>
              <div className="text-3xl font-bold text-[#10a37f]">${data.totalCost.toFixed(4)}</div>
              <div className="text-sm text-[#9b9b9b] mt-1">
                (約 {Math.round(data.totalCost * JPY_RATE).toLocaleString()}円)
              </div>
            </div>

            <section className="mb-6">
              <h2 className="text-sm font-medium text-[#9b9b9b] mb-3 uppercase tracking-wider">モデル別</h2>
              <div className="bg-[#2f2f2f] rounded-xl divide-y divide-[#424242]">
                {Object.entries(data.modelBreakdown).map(([model, info]) => (
                  <div key={model} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{model}</span>
                      <span className="text-sm text-[#10a37f]">${info.cost.toFixed(4)}</span>
                    </div>
                    <div className="text-xs text-[#9b9b9b]">
                      {info.count}回 | {info.tokens_in.toLocaleString()} in / {info.tokens_out.toLocaleString()} out
                    </div>
                  </div>
                ))}
                {Object.keys(data.modelBreakdown).length === 0 && (
                  <div className="px-4 py-6 text-center text-[#9b9b9b] text-sm">この月のデータはありません</div>
                )}
              </div>
            </section>

            <section>
              <h2 className="text-sm font-medium text-[#9b9b9b] mb-3 uppercase tracking-wider">日別推移</h2>
              <div className="bg-[#2f2f2f] rounded-xl p-4">
                {Object.keys(data.dailyBreakdown).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(data.dailyBreakdown)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([day, cost]) => {
                        const maxCost = Math.max(...Object.values(data.dailyBreakdown));
                        const width = maxCost > 0 ? (cost / maxCost) * 100 : 0;
                        return (
                          <div key={day} className="flex items-center gap-3">
                            <span className="text-xs text-[#9b9b9b] w-12 flex-shrink-0">{day.split('-')[2]}日</span>
                            <div className="flex-1 bg-[#171717] rounded-full h-4 overflow-hidden">
                              <div className="h-full bg-[#10a37f] rounded-full transition-all" style={{ width: `${width}%` }} />
                            </div>
                            <span className="text-xs text-[#9b9b9b] w-16 text-right">${cost.toFixed(4)}</span>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-center text-[#9b9b9b] text-sm py-4">この月のデータはありません</div>
                )}
              </div>
            </section>
          </>
        ) : (
          <div className="text-center text-[#9b9b9b] py-12">データの読み込みに失敗しました</div>
        )}
      </div>
    </div>
  );
}
