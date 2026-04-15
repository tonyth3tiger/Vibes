import React from 'react';
import { TaxStrategy } from '../types';
import { TrendingUp, PiggyBank, Heart, Briefcase, ChevronDown, ChevronUp, Loader2, AlertTriangle } from 'lucide-react';

interface Props {
  strategy: TaxStrategy;
  rank: number;
}

const CATEGORY_ICONS: Record<TaxStrategy['category'], React.ReactNode> = {
  retirement:  <PiggyBank className="w-5 h-5" />,
  equity:      <TrendingUp className="w-5 h-5" />,
  investment:  <Briefcase className="w-5 h-5" />,
  family:      <Heart className="w-5 h-5" />,
  charitable:  <Heart className="w-5 h-5" />,
};

const CATEGORY_COLORS: Record<TaxStrategy['category'], string> = {
  retirement:  'bg-blue-100 text-blue-700',
  equity:      'bg-purple-100 text-purple-700',
  investment:  'bg-teal-100 text-teal-700',
  family:      'bg-pink-100 text-pink-700',
  charitable:  'bg-amber-100 text-amber-700',
};

const PRIORITY_BADGE: Record<TaxStrategy['priority'], string> = {
  high:   'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low:    'bg-stone-100 text-stone-600',
};

const fmt = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export const StrategyCard: React.FC<Props> = ({ strategy, rank }) => {
  const [expanded, setExpanded] = React.useState(rank <= 2);

  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm transition-all ${
        strategy.isWarning
          ? 'border-red-300 shadow-red-100'
          : 'border-stone-200 hover:border-emerald-300 hover:shadow-md'
      }`}
    >
      {/* Card Header */}
      <div
        className="flex items-start gap-4 p-5 cursor-pointer"
        onClick={() => setExpanded(v => !v)}
        role="button"
        aria-expanded={expanded}
      >
        {/* Rank / Warning Badge */}
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${
            strategy.isWarning ? 'bg-red-500 text-white' : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          {strategy.isWarning ? <AlertTriangle className="w-5 h-5" /> : `#${rank}`}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-bold text-stone-900 text-base">{strategy.title}</h3>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_BADGE[strategy.priority]}`}>
              {strategy.priority} priority
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg ${CATEGORY_COLORS[strategy.category]}`}>
              {CATEGORY_ICONS[strategy.category]}
              {strategy.category}
            </span>
            {strategy.estimatedSavings > 0 && !strategy.isWarning && (
              <span className="text-sm font-bold text-emerald-700">
                ~{fmt(strategy.estimatedSavings)}/yr potential savings
              </span>
            )}
            {strategy.isWarning && (
              <span className="text-sm font-bold text-red-600">Action required</span>
            )}
          </div>
        </div>

        <div className="text-stone-400 shrink-0 mt-1">
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </div>

      {/* Expanded Body */}
      {expanded && (
        <div className="px-5 pb-5 pt-0 border-t border-stone-100">
          {/* AI Narrative (if loaded) or static description */}
          <div className="mt-4">
            {strategy.narrative === undefined ? (
              // Loading state
              <div className="flex items-center gap-2 text-sm text-stone-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating personalized insight...</span>
              </div>
            ) : strategy.narrative === '' ? (
              // Fallback to static description
              <p className="text-sm text-stone-600 leading-relaxed">{strategy.description}</p>
            ) : (
              // AI narrative
              <p className="text-sm text-stone-700 leading-relaxed italic">{strategy.narrative}</p>
            )}
          </div>

          {/* Static description always shown below narrative */}
          {strategy.narrative && strategy.narrative !== '' && (
            <p className="text-sm text-stone-500 leading-relaxed mt-3 pt-3 border-t border-stone-100">
              {strategy.description}
            </p>
          )}

          {/* Disclaimer per card */}
          <p className="text-xs text-stone-400 mt-4 pt-3 border-t border-stone-100 italic">
            This is for educational purposes only and does not constitute tax, legal, or financial advice.
            Consult a qualified tax professional before making financial decisions.
          </p>
        </div>
      )}
    </div>
  );
};
