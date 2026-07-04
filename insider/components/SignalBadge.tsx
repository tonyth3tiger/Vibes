import React from 'react';
import { SignalKind } from '../types';
import { SIGNAL_LABELS } from '../engine/scoring';

// Categorical slots from the validated dark palette, fixed order per kind.
export const SIGNAL_COLORS: Record<SignalKind, string> = {
  'smart-money': '#3987e5',
  'price-spike': '#199e70',
  'size-outlier': '#c98500',
  'fresh-wallet': '#9085e9',
  'flow-burst': '#d95926',
};

const SignalBadge: React.FC<{ kind: SignalKind }> = ({ kind }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-[#c3c2b7] whitespace-nowrap">
    <span
      className="h-2 w-2 rounded-full"
      style={{ backgroundColor: SIGNAL_COLORS[kind] }}
      aria-hidden
    />
    {SIGNAL_LABELS[kind]}
  </span>
);

export default SignalBadge;
