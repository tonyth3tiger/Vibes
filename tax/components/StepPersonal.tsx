import React from 'react';
import { TaxInputs, OtherDeduction, FilingStatus } from '../types';
import { STATE_TAX_DATA, FILING_STATUS_LABELS } from '../taxData';

interface Props {
  inputs: TaxInputs;
  onChange: (updates: Partial<TaxInputs>) => void;
  onNext: () => void;
}

const states = Object.entries(STATE_TAX_DATA).sort((a, b) => a[1].name.localeCompare(b[1].name));

function NumberStepper({ value, onChange, min = 0, max = 20 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-9 h-9 rounded-full border border-slate-200 bg-white text-slate-600 text-lg font-bold hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center leading-none"
        aria-label="Decrease"
      >−</button>
      <span className="w-8 text-center text-lg font-semibold text-slate-800">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-9 h-9 rounded-full border border-slate-200 bg-white text-slate-600 text-lg font-bold hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center leading-none"
        aria-label="Increase"
      >+</button>
    </div>
  );
}

function CurrencyInput({ value, onChange, label, id, helper }: { value: number; onChange: (v: number) => void; label: string; id: string; helper?: string }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {helper && <p className="text-xs text-slate-400 mb-1.5">{helper}</p>}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">$</span>
        <input
          id={id}
          type="number"
          min={0}
          value={value || ''}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          placeholder="0"
          className="w-full pl-7 pr-3 py-2.5 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
        />
      </div>
    </div>
  );
}

export const StepPersonal: React.FC<Props> = ({ inputs, onChange, onNext }) => {
  const canProceed = inputs.filingStatus && inputs.state && inputs.numJobs >= 1;

  const addOtherDeduction = () => {
    const newDeduction: OtherDeduction = { id: crypto.randomUUID(), label: '', annualAmount: 0 };
    onChange({ otherDeductions: [...inputs.otherDeductions, newDeduction] });
  };

  const updateOtherDeduction = (id: string, updates: Partial<OtherDeduction>) => {
    onChange({
      otherDeductions: inputs.otherDeductions.map(d => d.id === id ? { ...d, ...updates } : d),
    });
  };

  const removeOtherDeduction = (id: string) => {
    onChange({ otherDeductions: inputs.otherDeductions.filter(d => d.id !== id) });
  };

  return (
    <div className="space-y-8">
      {/* Personal info */}
      <fieldset className="space-y-5">
        <legend className="text-base font-semibold text-slate-800 pb-2 border-b border-slate-100 w-full">Personal Information</legend>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Filing Status</label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(FILING_STATUS_LABELS) as [FilingStatus, string][]).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => onChange({ filingStatus: value })}
                className={`px-3 py-2.5 rounded-lg border text-sm font-medium text-left transition-all ${
                  inputs.filingStatus === value
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="state" className="block text-sm font-medium text-slate-700 mb-1">State of Residence</label>
          <select
            id="state"
            value={inputs.state}
            onChange={e => onChange({ state: e.target.value })}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-white"
          >
            <option value="">Select a state…</option>
            {states.map(([code, info]) => (
              <option key={code} value={code}>{info.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Number of W-2 Jobs</label>
          <NumberStepper
            value={inputs.numJobs}
            onChange={v => onChange({ numJobs: v })}
            min={1}
            max={10}
          />
        </div>
      </fieldset>

      {/* Dependents */}
      <fieldset className="space-y-5">
        <legend className="text-base font-semibold text-slate-800 pb-2 border-b border-slate-100 w-full">Dependents</legend>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700">Qualifying children under 17</p>
            <p className="text-xs text-slate-400">$2,000 Child Tax Credit each</p>
          </div>
          <NumberStepper value={inputs.qualifyingChildren} onChange={v => onChange({ qualifyingChildren: v })} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700">Other dependents</p>
            <p className="text-xs text-slate-400">$500 credit each</p>
          </div>
          <NumberStepper value={inputs.otherDependents} onChange={v => onChange({ otherDependents: v })} />
        </div>
      </fieldset>

      {/* Pre-tax deductions */}
      <fieldset className="space-y-4">
        <legend className="text-base font-semibold text-slate-800 pb-2 border-b border-slate-100 w-full">Annual Pre-Tax Deductions</legend>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <CurrencyInput
            id="k401"
            label="401(k) / 403(b)"
            helper="Your annual contribution"
            value={inputs.annual401k}
            onChange={v => onChange({ annual401k: v })}
          />
          <CurrencyInput
            id="fsa"
            label="FSA"
            helper="Flexible Spending Account"
            value={inputs.annualFSA}
            onChange={v => onChange({ annualFSA: v })}
          />
          <CurrencyInput
            id="hsa"
            label="HSA"
            helper="Health Savings Account"
            value={inputs.annualHSA}
            onChange={v => onChange({ annualHSA: v })}
          />
        </div>

        {inputs.otherDeductions.map(d => (
          <div key={d.id} className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 mb-1">Label</label>
              <input
                type="text"
                value={d.label}
                onChange={e => updateOtherDeduction(d.id, { label: e.target.value })}
                placeholder="e.g. Student loan interest"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="w-36">
              <label className="block text-xs font-medium text-slate-500 mb-1">Annual amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input
                  type="number"
                  min={0}
                  value={d.annualAmount || ''}
                  onChange={e => updateOtherDeduction(d.id, { annualAmount: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full pl-7 pr-3 py-2.5 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeOtherDeduction(d.id)}
              className="mb-0.5 p-2.5 text-slate-400 hover:text-red-500 transition-colors"
              aria-label="Remove deduction"
            >
              ×
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addOtherDeduction}
          className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1.5 transition-colors"
        >
          <span className="text-lg leading-none">+</span> Add another deduction
        </button>
      </fieldset>

      {/* Self-employment */}
      <fieldset className="space-y-4">
        <legend className="text-base font-semibold text-slate-800 pb-2 border-b border-slate-100 w-full">Self-Employment / Small Business</legend>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700">I have self-employment income</p>
            <p className="text-xs text-slate-400">Freelance, 1099, sole proprietor, LLC</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={inputs.hasSelfEmployment}
            onClick={() => onChange({ hasSelfEmployment: !inputs.hasSelfEmployment })}
            className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${inputs.hasSelfEmployment ? 'bg-emerald-500' : 'bg-slate-200'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${inputs.hasSelfEmployment ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        {inputs.hasSelfEmployment && (
          <CurrencyInput
            id="seIncome"
            label="Net annual self-employment income"
            helper="Revenue minus business expenses (Schedule C net profit)"
            value={inputs.netSEIncome}
            onChange={v => onChange({ netSEIncome: v })}
          />
        )}
      </fieldset>

      <button
        type="button"
        onClick={onNext}
        disabled={!canProceed}
        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white disabled:text-slate-400 font-semibold rounded-xl transition-all shadow-sm shadow-emerald-100"
      >
        Continue to Job Details →
      </button>
    </div>
  );
};
