import React from 'react';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, ShieldAlert } from 'lucide-react';
import { MarketRecommendation, WalletAlert } from '../types';
import { walletLabel } from '../engine/detectors';
import SignalBadge from './SignalBadge';
import PriceChart from './PriceChart';

export const fmtUsd = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(1)}M`
    : n >= 1000
      ? `$${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k`
      : `$${n.toFixed(0)}`;

/** Severity is always icon + label, never color alone. */
const severity = (score: number) =>
  score >= 0.75
    ? { label: 'High', color: '#d03b3b' }
    : score >= 0.5
      ? { label: 'Elevated', color: '#ec835a' }
      : { label: 'Notable', color: '#fab219' };

const ScoreMeter: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div className="flex items-center gap-2" aria-label={`${label}: ${Math.round(value * 100)}%`}>
    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
      <div className="h-full rounded-full bg-[#3987e5]" style={{ width: `${value * 100}%` }} />
    </div>
    <span className="text-sm font-medium tabular-nums text-white">{Math.round(value * 100)}%</span>
  </div>
);

const DirectionChip: React.FC<{ direction: 'YES' | 'NO' }> = ({ direction }) => (
  <span className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/5 px-2 py-0.5 text-xs font-semibold text-white">
    {direction === 'YES' ? (
      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
    ) : (
      <ArrowDownRight className="h-3.5 w-3.5" aria-hidden />
    )}
    {direction}
  </span>
);

export const RecommendationCard: React.FC<{ rec: MarketRecommendation }> = ({ rec }) => (
  <article className="rounded-xl border border-white/10 bg-[#1a1a19] p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="mb-1 text-xs uppercase tracking-wide text-[#898781]">
          {rec.market.category} · ends{' '}
          {new Date(rec.market.endDate).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          })}
        </div>
        <h3 className="text-base font-semibold text-white">{rec.market.question}</h3>
      </div>
      <div className="flex items-center gap-3">
        <DirectionChip direction={rec.direction} />
        <ScoreMeter value={rec.confidence} label="Signal confidence" />
      </div>
    </div>

    <div className="mt-3 flex flex-wrap gap-1.5">
      {[...new Set(rec.signals.map((s) => s.kind))].map((k) => (
        <SignalBadge key={k} kind={k} />
      ))}
    </div>

    <div className="mt-4">
      <PriceChart data={rec.priceHistory} signals={rec.signals} />
    </div>

    <ul className="mt-3 space-y-1.5">
      {rec.rationale.slice(0, 3).map((line, i) => (
        <li key={i} className="flex gap-2 text-sm text-[#c3c2b7]">
          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#898781]" aria-hidden />
          {line}
        </li>
      ))}
    </ul>

    <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-[#898781]">
      <span>
        YES {Math.round(rec.market.yesPrice * 100)}¢ · 24h vol {fmtUsd(rec.market.volume24h)}
      </span>
      <span>Anomalous flow leans {rec.direction}</span>
    </div>
  </article>
);

export const WalletAlertCard: React.FC<{ alert: WalletAlert }> = ({ alert }) => {
  const sev = severity(alert.score);
  return (
    <article className="rounded-xl border border-white/10 bg-[#1a1a19] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="h-5 w-5" style={{ color: sev.color }} aria-hidden />
          <div>
            <div className="font-mono text-sm font-medium text-white">
              {walletLabel(alert.wallet, alert.pseudonym)}
            </div>
            <div className="text-xs text-[#898781]">
              {fmtUsd(alert.totalUsd)} of {alert.direction}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold"
            style={{ color: sev.color, backgroundColor: `${sev.color}1f` }}
          >
            <AlertTriangle className="h-3 w-3" aria-hidden />
            {sev.label}
          </span>
          <ScoreMeter value={alert.score} label="Suspicion score" />
        </div>
      </div>

      <p className="mt-3 text-sm text-[#c3c2b7]">{alert.marketQuestion}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {[...new Set(alert.signals.map((s) => s.kind))].map((k) => (
          <SignalBadge key={k} kind={k} />
        ))}
      </div>

      <ul className="mt-3 space-y-1.5">
        {alert.signals.slice(0, 4).map((s, i) => (
          <li key={i} className="flex gap-2 text-sm text-[#c3c2b7]">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#898781]" aria-hidden />
            {s.evidence}
          </li>
        ))}
      </ul>
    </article>
  );
};
