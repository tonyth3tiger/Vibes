import React from 'react';
import { TaxResult, TaxStrategy, TaxInputs } from '../types';
import { TaxBreakdown } from './TaxBreakdown';
import { StrategyCard } from './StrategyCard';
import { ArrowLeft, ShieldAlert, CalendarDays } from 'lucide-react';
import { STATE_TAX, TAX_YEAR } from '../taxData2024';

interface Props {
  inputs: TaxInputs;
  result: TaxResult;
  strategies: TaxStrategy[];
  onReset: () => void;
}

export const ResultsDashboard: React.FC<Props> = ({ inputs, result, strategies, onReset }) => {
  const stateName = STATE_TAX[inputs.stateCode]?.name ?? inputs.stateCode;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">

      {/* Top nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={onReset}
          className="flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Start over
        </button>
        <div className="flex items-center gap-2 text-xs text-stone-400">
          <CalendarDays className="w-4 h-4" />
          Tax Year {TAX_YEAR}
        </div>
      </div>

      {/* Disclaimer Banner */}
      <div className="flex gap-3 items-start bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          <strong>Educational use only.</strong> These estimates are for informational purposes and do not constitute
          tax, legal, or financial advice. Figures are approximations based on {TAX_YEAR} federal and{' '}
          {stateName} state tax rates. Consult a qualified CPA or tax advisor before making financial decisions.
        </p>
      </div>

      {/* Summary header */}
      <div>
        <h2 className="text-2xl font-bold text-stone-900">
          Your {TAX_YEAR} Tax Analysis
        </h2>
        <p className="text-stone-500 text-sm mt-1">
          {inputs.filingStatus === 'mfj' ? 'Married Filing Jointly' :
           inputs.filingStatus === 'mfs' ? 'Married Filing Separately' :
           inputs.filingStatus === 'hoh' ? 'Head of Household' : 'Single'} · {stateName} ·
          {result.marginalRateLabel} federal bracket
        </p>
      </div>

      {/* Tax Breakdown */}
      <TaxBreakdown result={result} strategies={strategies} />

      {/* Strategies */}
      <div>
        <h3 className="text-xl font-bold text-stone-900 mb-1">
          Tax Savings Strategies
        </h3>
        <p className="text-sm text-stone-500 mb-5">
          {strategies.length} strategies identified for your situation, ranked by potential impact.
        </p>
        <div className="space-y-3">
          {strategies.map((strategy, i) => (
            <StrategyCard
              key={strategy.id}
              strategy={strategy}
              rank={i + 1}
            />
          ))}
        </div>
      </div>

      {/* Footer disclaimer */}
      <div className="border-t border-stone-200 pt-6 pb-8 text-center">
        <p className="text-xs text-stone-400 max-w-2xl mx-auto">
          Calculations use {TAX_YEAR} IRS brackets and {stateName} state rates. Standard deduction applied.
          AMT, SALT itemization, self-employment tax, and other deductions are not modeled.
          Estimated savings figures are illustrative — actual results depend on your full tax picture.
        </p>
      </div>
    </div>
  );
};
