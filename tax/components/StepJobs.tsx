import React from 'react';
import { JobEntry, PayFrequency, TaxInputs } from '../types';
import { PAY_FREQUENCY_LABELS, PAY_PERIODS } from '../taxData';

interface Props {
  inputs: TaxInputs;
  onChange: (updates: Partial<TaxInputs>) => void;
  onNext: () => void;
  onBack: () => void;
}

const frequencies: PayFrequency[] = ['weekly', 'biweekly', 'semimonthly', 'monthly'];

function JobCard({
  job,
  index,
  onUpdate,
  onRemove,
  canRemove,
}: {
  job: JobEntry;
  index: number;
  onUpdate: (updates: Partial<JobEntry>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const annualGross = job.grossPayPerPeriod * (PAY_PERIODS[job.payFrequency] ?? 26);
  const annualWithheld = job.withholdingPerPeriod * (PAY_PERIODS[job.payFrequency] ?? 26);

  return (
    <div className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold flex items-center justify-center">
            {index + 1}
          </div>
          <input
            type="text"
            value={job.label}
            onChange={e => onUpdate({ label: e.target.value })}
            placeholder={`Job ${index + 1}`}
            className="text-sm font-semibold text-slate-700 bg-transparent border-none outline-none placeholder:text-slate-400 w-48"
            aria-label={`Job ${index + 1} label`}
          />
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-slate-300 hover:text-red-400 transition-colors text-xl leading-none"
            aria-label="Remove job"
          >
            ×
          </button>
        )}
      </div>

      {/* Card body */}
      <div className="p-5 space-y-4">
        {/* Pay frequency */}
        <div>
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Pay Frequency</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {frequencies.map(f => (
              <button
                key={f}
                type="button"
                onClick={() => onUpdate({ payFrequency: f })}
                className={`px-2.5 py-2 rounded-lg border text-xs font-medium text-center transition-all ${
                  job.payFrequency === f
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {PAY_FREQUENCY_LABELS[f]}
              </button>
            ))}
          </div>
        </div>

        {/* Income & withholding */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
              Gross Pay per Paycheck
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <input
                type="number"
                min={0}
                value={job.grossPayPerPeriod || ''}
                onChange={e => onUpdate({ grossPayPerPeriod: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2.5 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>
            {annualGross > 0 && (
              <p className="text-xs text-slate-400 mt-1">≈ ${annualGross.toLocaleString()} / year</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
              Federal Tax Withheld per Paycheck
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <input
                type="number"
                min={0}
                value={job.withholdingPerPeriod || ''}
                onChange={e => onUpdate({ withholdingPerPeriod: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2.5 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>
            {annualWithheld > 0 && (
              <p className="text-xs text-slate-400 mt-1">≈ ${annualWithheld.toLocaleString()} / year withheld</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export const StepJobs: React.FC<Props> = ({ inputs, onChange, onNext, onBack }) => {
  const jobs = inputs.jobs;

  const syncJobCount = (newJobs: JobEntry[]) => {
    onChange({ jobs: newJobs });
  };

  const addJob = () => {
    const newJob: JobEntry = {
      id: crypto.randomUUID(),
      label: '',
      grossPayPerPeriod: 0,
      payFrequency: 'biweekly',
      withholdingPerPeriod: 0,
    };
    syncJobCount([...jobs, newJob]);
  };

  const removeJob = (id: string) => {
    syncJobCount(jobs.filter(j => j.id !== id));
  };

  const updateJob = (id: string, updates: Partial<JobEntry>) => {
    syncJobCount(jobs.map(j => j.id === id ? { ...j, ...updates } : j));
  };

  const allJobsValid = jobs.every(j => j.grossPayPerPeriod > 0);

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Enter details for each job. Check your pay stub for exact gross pay and federal withholding amounts.
      </p>

      <div className="space-y-3">
        {jobs.map((job, i) => (
          <React.Fragment key={job.id}>
            <JobCard
              job={job}
              index={i}
              onUpdate={u => updateJob(job.id, u)}
              onRemove={() => removeJob(job.id)}
              canRemove={jobs.length > 1}
            />
          </React.Fragment>
        ))}
      </div>

      {jobs.length < 10 && (
        <button
          type="button"
          onClick={addJob}
          className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm font-medium text-slate-400 hover:border-emerald-300 hover:text-emerald-600 transition-all"
        >
          + Add another job
        </button>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3.5 border border-slate-200 bg-white text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-all"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!allJobsValid}
          className="flex-[2] py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white disabled:text-slate-400 font-semibold rounded-xl transition-all shadow-sm shadow-emerald-100"
        >
          Calculate My Taxes →
        </button>
      </div>
    </div>
  );
};
