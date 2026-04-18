import React, { useState, useEffect, useRef } from 'react';
import { TaxInputs, TaxResults, JobEntry, Step } from './types';
import { computeResults } from './calculations';
import { StepPersonal } from './components/StepPersonal';
import { StepJobs } from './components/StepJobs';
import { StepResults } from './components/StepResults';

const DEFAULT_JOB: JobEntry = {
  id: crypto.randomUUID(),
  label: '',
  grossPayPerPeriod: 0,
  payFrequency: 'biweekly',
  withholdingPerPeriod: 0,
};

const DEFAULT_INPUTS: TaxInputs = {
  filingStatus: 'single',
  state: '',
  numJobs: 1,
  jobs: [{ ...DEFAULT_JOB }],
  qualifyingChildren: 0,
  otherDependents: 0,
  annual401k: 0,
  annualFSA: 0,
  annualHSA: 0,
  otherDeductions: [],
  hasSelfEmployment: false,
  netSEIncome: 0,
};

const STEP_LABELS = ['Personal Info', 'Job Details', 'Your Results'];

function ProgressStepper({ step }: { step: Step }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEP_LABELS.map((label, i) => {
        const stepNum = (i + 1) as Step;
        const isComplete = step > stepNum;
        const isCurrent = step === stepNum;
        return (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  isComplete
                    ? 'bg-emerald-500 text-white'
                    : isCurrent
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {isComplete ? '✓' : stepNum}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${isCurrent ? 'text-emerald-700' : isComplete ? 'text-slate-500' : 'text-slate-400'}`}>
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div className={`flex-1 h-0.5 mt-[-16px] transition-colors ${isComplete ? 'bg-emerald-400' : 'bg-slate-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export const TaxCalculator: React.FC = () => {
  const [step, setStep] = useState<Step>(1);
  const [inputs, setInputs] = useState<TaxInputs>(DEFAULT_INPUTS);
  const [results, setResults] = useState<TaxResults | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const updateInputs = (updates: Partial<TaxInputs>) => {
    setInputs(prev => {
      const next = { ...prev, ...updates };
      // Sync job list length when numJobs changes
      if ('numJobs' in updates) {
        const target = updates.numJobs ?? prev.numJobs;
        while (next.jobs.length < target) {
          next.jobs = [...next.jobs, { id: crypto.randomUUID(), label: '', grossPayPerPeriod: 0, payFrequency: 'biweekly', withholdingPerPeriod: 0 }];
        }
        if (next.jobs.length > target) {
          next.jobs = next.jobs.slice(0, target);
        }
      }
      return next;
    });
  };

  const goToStep = (s: Step) => {
    setStep(s);
    // Small delay so DOM settles before scroll
    setTimeout(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const handleStep1Next = () => goToStep(2);

  const handleStep2Next = () => {
    const r = computeResults(inputs);
    setResults(r);
    goToStep(3);
  };

  const handleReset = () => {
    setInputs(DEFAULT_INPUTS);
    setResults(null);
    goToStep(1);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans" ref={topRef}>
      <div className="max-w-2xl mx-auto px-4 py-10 sm:py-16">
        {/* Page header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4 uppercase tracking-wide">
            <span>Multi-Job</span>
            <span className="w-1 h-1 rounded-full bg-emerald-400 inline-block" />
            <span>Federal + State</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-3">
            Quarterly Tax Calculator
          </h1>
          <p className="text-slate-500 text-base max-w-md mx-auto">
            Find out exactly how much to send the IRS each quarter when you have multiple jobs.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-100 p-6 sm:p-8">
          <ProgressStepper step={step} />

          {step === 1 && (
            <StepPersonal inputs={inputs} onChange={updateInputs} onNext={handleStep1Next} />
          )}
          {step === 2 && (
            <StepJobs inputs={inputs} onChange={updateInputs} onNext={handleStep2Next} onBack={() => goToStep(1)} />
          )}
          {step === 3 && results && (
            <StepResults results={results} inputs={inputs} onBack={() => goToStep(2)} onReset={handleReset} />
          )}
        </div>
      </div>
    </div>
  );
};
