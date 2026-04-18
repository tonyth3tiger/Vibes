import React, { useState, useEffect, useRef } from 'react';
import { TaxResults, TaxInputs } from '../types';
import { STATE_TAX_DATA, FILING_STATUS_LABELS } from '../taxData';

interface Props {
  results: TaxResults;
  inputs: TaxInputs;
  onBack: () => void;
  onReset: () => void;
}

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function fmtExact(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function useCountUp(target: number, duration = 900): number {
  const [current, setCurrent] = useState(0);
  const startTime = useRef<number | null>(null);
  const startVal = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    startVal.current = 0;
    startTime.current = null;

    const step = (ts: number) => {
      if (startTime.current === null) startTime.current = ts;
      const elapsed = ts - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(startVal.current + (target - startVal.current) * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return current;
}

function HeroAmount({ amount, label }: { amount: number; label: string }) {
  const animated = useCountUp(amount);
  const color = amount <= 0 ? 'text-emerald-600' : amount < 500 ? 'text-amber-500' : 'text-red-500';
  const bg = amount <= 0 ? 'bg-emerald-50 border-emerald-100' : amount < 500 ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100';

  return (
    <div className={`rounded-2xl border p-8 text-center ${bg}`}>
      <p className="text-sm font-medium text-slate-500 uppercase tracking-widest mb-2">{label}</p>
      <p className={`text-6xl font-black tabular-nums ${color}`}>
        {animated < 0 ? '−' : ''}{fmt(Math.abs(animated))}
      </p>
      {amount < 0 && (
        <p className="text-sm text-emerald-600 mt-2 font-medium">You're over-withheld — expect a refund!</p>
      )}
      {amount === 0 && (
        <p className="text-sm text-emerald-600 mt-2 font-medium">You're right on track — nothing extra owed.</p>
      )}
    </div>
  );
}

function LineItem({ label, value, sub, highlight, negative }: { label: string; value: string; sub?: string; highlight?: boolean; negative?: boolean }) {
  return (
    <div className={`flex items-start justify-between py-2.5 ${highlight ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
      <div>
        <span className="text-sm">{label}</span>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
      <span className={`text-sm tabular-nums ml-4 shrink-0 ${negative ? 'text-emerald-600' : highlight ? 'text-slate-800' : 'text-slate-700'}`}>
        {value}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="border-t border-slate-100 my-1" />;
}

export const StepResults: React.FC<Props> = ({ results, inputs, onBack, onReset }) => {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const r = results;
  const stateName = STATE_TAX_DATA[inputs.state]?.name ?? inputs.state;

  const quarterlyOwed = r.quarterlyFederalPayment;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <HeroAmount amount={quarterlyOwed} label="Estimated Quarterly IRS Payment" />

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Annual tax liability', val: fmt(r.totalFederalTax) },
          { label: 'Already withheld', val: fmt(r.totalWithheld) },
          { label: 'Effective rate', val: `${r.taxableIncome > 0 ? ((r.federalIncomeTax / r.agi) * 100).toFixed(1) : '0.0'}%` },
        ].map(({ label, val }) => (
          <div key={label} className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
            <p className="text-xs text-slate-400 mb-1">{label}</p>
            <p className="text-lg font-bold text-slate-800 tabular-nums">{val}</p>
          </div>
        ))}
      </div>

      {/* Quarterly due dates */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-sm font-semibold text-blue-800 mb-2">2025 Estimated Tax Due Dates</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-blue-700">
          {[['Q1', 'Apr 15'], ['Q2', 'Jun 16'], ['Q3', 'Sep 15'], ['Q4', 'Jan 15, 2026']].map(([q, d]) => (
            <div key={q} className="bg-white rounded-lg px-3 py-2 text-center border border-blue-100">
              <p className="font-bold">{q}</p>
              <p>{d}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Federal breakdown (collapsible) */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowBreakdown(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-slate-50 transition-colors"
        >
          <span className="text-sm font-semibold text-slate-700">Federal Tax Breakdown</span>
          <span className="text-slate-400 text-lg">{showBreakdown ? '▲' : '▼'}</span>
        </button>

        {showBreakdown && (
          <div className="px-5 pb-5 divide-y divide-slate-100 border-t border-slate-100">
            <LineItem label="Total W-2 gross income" value={fmt(r.totalW2Income)} />
            {inputs.hasSelfEmployment && (
              <LineItem label="Self-employment income" value={fmt(inputs.netSEIncome)} />
            )}
            {r.totalPreTaxDeductions > 0 && (
              <LineItem label="Pre-tax deductions" value={`− ${fmt(r.totalPreTaxDeductions)}`} negative />
            )}
            {r.seTaxDeduction > 0 && (
              <LineItem label="SE tax deduction (½ of SE tax)" value={`− ${fmt(r.seTaxDeduction)}`} negative sub="Reduces AGI" />
            )}
            <LineItem label="Adjusted Gross Income (AGI)" value={fmt(r.agi)} highlight />
            <LineItem label="Standard deduction" value={`− ${fmt(r.standardDeduction)}`} negative sub={FILING_STATUS_LABELS[inputs.filingStatus]} />
            <LineItem label="Federal taxable income" value={fmt(r.taxableIncome)} highlight />
            <Divider />

            {r.bracketBreakdown.map((b, i) => (
              <React.Fragment key={i}>
                <LineItem
                  label={`${(b.rate * 100).toFixed(0)}% bracket`}
                  value={fmtExact(b.taxInBracket)}
                  sub={`on ${fmt(b.taxableInBracket)}`}
                />
              </React.Fragment>
            ))}
            <LineItem label="Federal income tax" value={fmt(r.federalIncomeTax)} highlight />

            {r.seTax > 0 && (
              <LineItem label="Self-employment tax (15.3%)" value={fmt(r.seTax)} sub="Social Security + Medicare on SE income" />
            )}
            {r.childTaxCredit > 0 && (
              <LineItem label="Child Tax Credit" value={`− ${fmt(r.childTaxCredit)}`} negative sub={`${inputs.qualifyingChildren} qualifying child${inputs.qualifyingChildren > 1 ? 'ren' : ''}`} />
            )}
            {r.otherDependentCredit > 0 && (
              <LineItem label="Other Dependent Credit" value={`− ${fmt(r.otherDependentCredit)}`} negative />
            )}
            <LineItem label="Total federal tax liability" value={fmt(r.totalFederalTax)} highlight />
            <Divider />
            <LineItem label="Total withheld (all jobs)" value={`− ${fmt(r.totalWithheld)}`} negative />
            <LineItem
              label={r.federalUnderpayment >= 0 ? 'Amount owed to IRS' : 'Expected refund'}
              value={fmt(Math.abs(r.federalUnderpayment))}
              highlight
            />
          </div>
        )}
      </div>

      {/* State tax section */}
      <div className="border border-slate-200 rounded-xl p-5 space-y-3">
        <p className="text-sm font-semibold text-slate-700">{stateName} State Tax (Estimate)</p>
        {STATE_TAX_DATA[inputs.state]?.hasIncomeTax ? (
          <>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Estimated annual state tax</span>
              <span className="text-sm font-semibold text-slate-800 tabular-nums">{fmt(r.estimatedStateTax)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Estimated quarterly state payment</span>
              <span className="text-sm font-semibold text-slate-800 tabular-nums">{fmt(r.quarterlyStatePayment)}</span>
            </div>
          </>
        ) : (
          <p className="text-sm text-emerald-600 font-medium">{stateName} has no state income tax. 🎉</p>
        )}
        <p className="text-xs text-slate-400">{r.stateWithholdingNote}</p>
      </div>

      {/* Safe harbor callout */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-amber-800 mb-1">Safe Harbor Rule</p>
        <p className="text-sm text-amber-700">
          To avoid underpayment penalties, pay the lesser of: (a) 90% of this year's tax liability, or (b) 100% of last year's tax (110% if last year's AGI exceeded $150,000).
          If you owe less than $1,000 after withholding, no penalty applies.
        </p>
      </div>

      {/* Footer actions */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 border border-slate-200 bg-white text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-all text-sm"
        >
          ← Edit Jobs
        </button>
        <button
          type="button"
          onClick={onReset}
          className="flex-1 py-3 border border-slate-200 bg-white text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-all text-sm"
        >
          Start Over
        </button>
      </div>

      <p className="text-center text-xs text-slate-400">
        Based on 2025 IRS tax tables. This is an estimate — consult a CPA or tax professional for personalized guidance.
      </p>
    </div>
  );
};
