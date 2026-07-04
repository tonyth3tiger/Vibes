import React from 'react';
import { MarketData } from '../types';
import { fmtUsd } from './cards';

export interface MarketRow {
  data: MarketData;
  /** Max composite score any alert/recommendation reached for this market */
  score: number;
  signalCount: number;
}

const daysUntil = (iso: string) => {
  const d = (Date.parse(iso) - Date.now()) / 86_400_000;
  return d < 1 ? '<1d' : `${Math.round(d)}d`;
};

/** Table view of every scanned market — doubles as the accessible data view. */
const MarketsTable: React.FC<{ rows: MarketRow[] }> = ({ rows }) => (
  <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#1a1a19]">
    <table className="w-full min-w-[640px] text-sm">
      <thead>
        <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-[#898781]">
          <th className="px-4 py-3 font-medium">Market</th>
          <th className="px-4 py-3 font-medium">Category</th>
          <th className="px-4 py-3 text-right font-medium">YES</th>
          <th className="px-4 py-3 text-right font-medium">24h volume</th>
          <th className="px-4 py-3 text-right font-medium">Liquidity</th>
          <th className="px-4 py-3 text-right font-medium">Ends</th>
          <th className="px-4 py-3 text-right font-medium">Signals</th>
          <th className="px-4 py-3 text-right font-medium">Anomaly</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ data, score, signalCount }) => (
          <tr key={data.market.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
            <td className="max-w-xs px-4 py-3 text-white">{data.market.question}</td>
            <td className="px-4 py-3 text-[#c3c2b7]">{data.market.category}</td>
            <td className="px-4 py-3 text-right tabular-nums text-[#c3c2b7]">
              {Math.round(data.market.yesPrice * 100)}¢
            </td>
            <td className="px-4 py-3 text-right tabular-nums text-[#c3c2b7]">
              {fmtUsd(data.market.volume24h)}
            </td>
            <td className="px-4 py-3 text-right tabular-nums text-[#c3c2b7]">
              {fmtUsd(data.market.liquidity)}
            </td>
            <td className="px-4 py-3 text-right tabular-nums text-[#c3c2b7]">
              {daysUntil(data.market.endDate)}
            </td>
            <td className="px-4 py-3 text-right tabular-nums text-[#c3c2b7]">{signalCount}</td>
            <td className="px-4 py-3 text-right">
              {score > 0 ? (
                <span className="font-medium tabular-nums text-white">
                  {Math.round(score * 100)}%
                </span>
              ) : (
                <span className="text-[#898781]">—</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default MarketsTable;
