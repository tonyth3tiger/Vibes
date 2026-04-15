import React, { useState } from 'react';
import { TaxInputs, FilingStatus } from '../types';
import { STATE_TAX } from '../taxData2024';
import { DollarSign, Users, MapPin, TrendingUp, ChevronRight, AlertCircle } from 'lucide-react';

interface Props {
  onSubmit: (inputs: TaxInputs) => void;
}

const FILING_STATUS_OPTIONS: { value: FilingStatus; label: string }[] = [
  { value: 'single', label: 'Single' },
  { value: 'mfj',    label: 'Married Filing Jointly' },
  { value: 'mfs',    label: 'Married Filing Separately' },
  { value: 'hoh',    label: 'Head of Household' },
];

const STATE_OPTIONS = Object.entries(STATE_TAX)
  .map(([code, info]) => ({ code, name: info.name }))
  .sort((a, b) => a.name.localeCompare(b.name));

const parseDollar = (val: string): number => {
  const cleaned = val.replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
};

const formatDollarInput = (val: string): string => {
  const num = parseDollar(val);
  if (!num) return '';
  return num.toLocaleString('en-US');
};

interface FieldErrors {
  grossIncome?: string;
  age?: string;
  rsuPrice?: string;
}

export const InputForm: React.FC<Props> = ({ onSubmit }) => {
  const [grossIncome, setGrossIncome]       = useState('');
  const [filingStatus, setFilingStatus]     = useState<FilingStatus>('single');
  const [rsuShares, setRsuShares]           = useState('');
  const [rsuVestPrice, setRsuVestPrice]     = useState('');
  const [stateCode, setStateCode]           = useState('CA');
  const [dependents, setDependents]         = useState('0');
  const [age, setAge]                       = useState('');
  const [existing401k, setExisting401k]     = useState('');
  const [errors, setErrors]                 = useState<FieldErrors>({});

  const validate = (): boolean => {
    const newErrors: FieldErrors = {};
    if (parseDollar(grossIncome) <= 0) {
      newErrors.grossIncome = 'Please enter a valid annual income.';
    }
    const ageNum = parseInt(age, 10);
    if (!age || ageNum < 18 || ageNum > 100) {
      newErrors.age = 'Please enter a valid age (18–100).';
    }
    const sharesNum = parseDollar(rsuShares);
    const priceNum = parseDollar(rsuVestPrice);
    if (sharesNum > 0 && priceNum <= 0) {
      newErrors.rsuPrice = 'Please enter the vest price per share.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const inputs: TaxInputs = {
      grossIncome:   parseDollar(grossIncome),
      filingStatus,
      rsuShares:     parseDollar(rsuShares),
      rsuVestPrice:  parseDollar(rsuVestPrice),
      stateCode,
      dependents:    parseInt(dependents, 10) || 0,
      age:           parseInt(age, 10),
      existing401k:  parseDollar(existing401k),
    };
    onSubmit(inputs);
  };

  const inputClass = (hasError?: boolean) =>
    `w-full px-4 py-3 rounded-xl border ${hasError ? 'border-red-400 bg-red-50' : 'border-stone-200 bg-white'} ` +
    `text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all`;

  const labelClass = 'block text-sm font-semibold text-stone-700 mb-1.5';

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-6">
          <h2 className="text-2xl font-bold text-white">Your Tax Profile</h2>
          <p className="text-emerald-100 text-sm mt-1">
            All calculations run locally in your browser — nothing is stored or sent to our servers.
          </p>
        </div>

        <div className="px-8 py-8 space-y-6">

          {/* Income */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>
                <span className="flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-emerald-600" /> Annual Gross Income</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-medium">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="350,000"
                  value={grossIncome}
                  onChange={e => setGrossIncome(e.target.value)}
                  onBlur={e => setGrossIncome(formatDollarInput(e.target.value))}
                  className={inputClass(!!errors.grossIncome) + ' pl-8'}
                />
              </div>
              {errors.grossIncome && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.grossIncome}</p>
              )}
              <p className="text-xs text-stone-400 mt-1">Salary + bonus, before equity</p>
            </div>

            <div>
              <label className={labelClass}>Filing Status</label>
              <select
                value={filingStatus}
                onChange={e => setFilingStatus(e.target.value as FilingStatus)}
                className={inputClass()}
              >
                {FILING_STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* RSU Equity */}
          <div>
            <label className={labelClass}>
              <span className="flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-emerald-600" /> RSU Equity (optional)</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="500 shares"
                  value={rsuShares}
                  onChange={e => setRsuShares(e.target.value.replace(/[^0-9]/g, ''))}
                  className={inputClass()}
                />
                <p className="text-xs text-stone-400 mt-1">Shares vested this year</p>
              </div>
              <div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-medium">$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="250.00"
                    value={rsuVestPrice}
                    onChange={e => setRsuVestPrice(e.target.value)}
                    onBlur={e => setRsuVestPrice(formatDollarInput(e.target.value))}
                    className={inputClass(!!errors.rsuPrice) + ' pl-8'}
                  />
                </div>
                {errors.rsuPrice && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.rsuPrice}</p>
                )}
                <p className="text-xs text-stone-400 mt-1">Fair market value at vest</p>
              </div>
            </div>
          </div>

          {/* Location & Dependents */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-emerald-600" /> State of Residence</span>
              </label>
              <select
                value={stateCode}
                onChange={e => setStateCode(e.target.value)}
                className={inputClass()}
              >
                {STATE_OPTIONS.map(opt => (
                  <option key={opt.code} value={opt.code}>{opt.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-emerald-600" /> Dependents</span>
              </label>
              <select
                value={dependents}
                onChange={e => setDependents(e.target.value)}
                className={inputClass()}
              >
                {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Age & Existing 401k */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Your Age</label>
              <input
                type="number"
                min={18}
                max={100}
                placeholder="42"
                value={age}
                onChange={e => setAge(e.target.value)}
                className={inputClass(!!errors.age)}
              />
              {errors.age && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.age}</p>
              )}
              <p className="text-xs text-stone-400 mt-1">Affects catch-up contribution eligibility</p>
            </div>

            <div>
              <label className={labelClass}>
                <span className="flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-emerald-600" /> 2024 401(k) Contributions So Far</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-medium">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={existing401k}
                  onChange={e => setExisting401k(e.target.value)}
                  onBlur={e => setExisting401k(formatDollarInput(e.target.value))}
                  className={inputClass() + ' pl-8'}
                />
              </div>
              <p className="text-xs text-stone-400 mt-1">Leave blank if none yet</p>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 mt-2"
          >
            Analyze My Tax Situation
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </form>
  );
};
