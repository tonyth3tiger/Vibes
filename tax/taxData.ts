import { FilingStatus } from './types';

export const PAY_PERIODS: Record<string, number> = {
  weekly: 52,
  biweekly: 26,
  semimonthly: 24,
  monthly: 12,
};

// 2025 federal tax brackets [max income in bracket, rate]
// Infinity marks the top bracket
type Bracket = { max: number; rate: number };

export const FEDERAL_BRACKETS: Record<FilingStatus, Bracket[]> = {
  single: [
    { max: 11925, rate: 0.10 },
    { max: 48475, rate: 0.12 },
    { max: 103350, rate: 0.22 },
    { max: 197300, rate: 0.24 },
    { max: 250525, rate: 0.32 },
    { max: 626350, rate: 0.35 },
    { max: Infinity, rate: 0.37 },
  ],
  mfj: [
    { max: 23850, rate: 0.10 },
    { max: 96950, rate: 0.12 },
    { max: 206700, rate: 0.22 },
    { max: 394600, rate: 0.24 },
    { max: 501050, rate: 0.32 },
    { max: 751600, rate: 0.35 },
    { max: Infinity, rate: 0.37 },
  ],
  mfs: [
    { max: 11925, rate: 0.10 },
    { max: 48475, rate: 0.12 },
    { max: 103350, rate: 0.22 },
    { max: 197300, rate: 0.24 },
    { max: 250525, rate: 0.32 },
    { max: 375800, rate: 0.35 },
    { max: Infinity, rate: 0.37 },
  ],
  hoh: [
    { max: 17000, rate: 0.10 },
    { max: 64850, rate: 0.12 },
    { max: 103350, rate: 0.22 },
    { max: 197300, rate: 0.24 },
    { max: 250500, rate: 0.32 },
    { max: 626350, rate: 0.35 },
    { max: Infinity, rate: 0.37 },
  ],
};

export const STANDARD_DEDUCTIONS: Record<FilingStatus, number> = {
  single: 15000,
  mfj: 30000,
  mfs: 15000,
  hoh: 22500,
};

// Child Tax Credit phase-out threshold by filing status
export const CTC_PHASEOUT_THRESHOLD: Record<FilingStatus, number> = {
  single: 200000,
  mfj: 400000,
  mfs: 200000,
  hoh: 200000,
};

export interface StateTaxInfo {
  name: string;
  hasIncomeTax: boolean;
  // For flat-rate states
  flatRate?: number;
  // For bracketed states: [max income, rate]
  brackets?: { max: number; rate: number }[];
  // Standard deduction (0 if none)
  standardDeduction?: number;
}

export const STATE_TAX_DATA: Record<string, StateTaxInfo> = {
  AL: { name: 'Alabama', hasIncomeTax: true, brackets: [{ max: 500, rate: 0.02 }, { max: 3000, rate: 0.04 }, { max: Infinity, rate: 0.05 }], standardDeduction: 2500 },
  AK: { name: 'Alaska', hasIncomeTax: false },
  AZ: { name: 'Arizona', hasIncomeTax: true, flatRate: 0.025 },
  AR: { name: 'Arkansas', hasIncomeTax: true, brackets: [{ max: 4400, rate: 0.02 }, { max: 8800, rate: 0.04 }, { max: Infinity, rate: 0.047 }], standardDeduction: 2200 },
  CA: { name: 'California', hasIncomeTax: true, brackets: [{ max: 10099, rate: 0.01 }, { max: 23942, rate: 0.02 }, { max: 37788, rate: 0.04 }, { max: 52455, rate: 0.06 }, { max: 66295, rate: 0.08 }, { max: 338639, rate: 0.093 }, { max: 406364, rate: 0.103 }, { max: 677275, rate: 0.113 }, { max: 1000000, rate: 0.123 }, { max: Infinity, rate: 0.133 }], standardDeduction: 5202 },
  CO: { name: 'Colorado', hasIncomeTax: true, flatRate: 0.044 },
  CT: { name: 'Connecticut', hasIncomeTax: true, brackets: [{ max: 10000, rate: 0.03 }, { max: 50000, rate: 0.05 }, { max: 100000, rate: 0.055 }, { max: 200000, rate: 0.06 }, { max: 250000, rate: 0.065 }, { max: 500000, rate: 0.069 }, { max: Infinity, rate: 0.0699 }] },
  DE: { name: 'Delaware', hasIncomeTax: true, brackets: [{ max: 2000, rate: 0 }, { max: 5000, rate: 0.022 }, { max: 10000, rate: 0.039 }, { max: 20000, rate: 0.048 }, { max: 25000, rate: 0.052 }, { max: 60000, rate: 0.0555 }, { max: Infinity, rate: 0.066 }], standardDeduction: 3250 },
  FL: { name: 'Florida', hasIncomeTax: false },
  GA: { name: 'Georgia', hasIncomeTax: true, flatRate: 0.055 },
  HI: { name: 'Hawaii', hasIncomeTax: true, brackets: [{ max: 2400, rate: 0.014 }, { max: 4800, rate: 0.032 }, { max: 9600, rate: 0.055 }, { max: 14400, rate: 0.064 }, { max: 19200, rate: 0.068 }, { max: 24000, rate: 0.072 }, { max: 36000, rate: 0.076 }, { max: 48000, rate: 0.079 }, { max: 150000, rate: 0.0825 }, { max: 175000, rate: 0.09 }, { max: 200000, rate: 0.10 }, { max: Infinity, rate: 0.11 }], standardDeduction: 2200 },
  ID: { name: 'Idaho', hasIncomeTax: true, flatRate: 0.058 },
  IL: { name: 'Illinois', hasIncomeTax: true, flatRate: 0.0495 },
  IN: { name: 'Indiana', hasIncomeTax: true, flatRate: 0.0305 },
  IA: { name: 'Iowa', hasIncomeTax: true, flatRate: 0.038 },
  KS: { name: 'Kansas', hasIncomeTax: true, brackets: [{ max: 15000, rate: 0.031 }, { max: 30000, rate: 0.0525 }, { max: Infinity, rate: 0.057 }], standardDeduction: 3500 },
  KY: { name: 'Kentucky', hasIncomeTax: true, flatRate: 0.04 },
  LA: { name: 'Louisiana', hasIncomeTax: true, brackets: [{ max: 12500, rate: 0.0185 }, { max: 50000, rate: 0.035 }, { max: Infinity, rate: 0.0425 }], standardDeduction: 4500 },
  ME: { name: 'Maine', hasIncomeTax: true, brackets: [{ max: 24500, rate: 0.058 }, { max: 58050, rate: 0.0675 }, { max: Infinity, rate: 0.0715 }], standardDeduction: 14600 },
  MD: { name: 'Maryland', hasIncomeTax: true, brackets: [{ max: 1000, rate: 0.02 }, { max: 2000, rate: 0.03 }, { max: 3000, rate: 0.04 }, { max: 100000, rate: 0.0475 }, { max: 125000, rate: 0.05 }, { max: 150000, rate: 0.0525 }, { max: 250000, rate: 0.055 }, { max: Infinity, rate: 0.0575 }], standardDeduction: 2550 },
  MA: { name: 'Massachusetts', hasIncomeTax: true, flatRate: 0.05 },
  MI: { name: 'Michigan', hasIncomeTax: true, flatRate: 0.0425 },
  MN: { name: 'Minnesota', hasIncomeTax: true, brackets: [{ max: 31690, rate: 0.0535 }, { max: 104090, rate: 0.068 }, { max: 193240, rate: 0.0785 }, { max: Infinity, rate: 0.0985 }], standardDeduction: 14575 },
  MS: { name: 'Mississippi', hasIncomeTax: true, flatRate: 0.05 },
  MO: { name: 'Missouri', hasIncomeTax: true, brackets: [{ max: 1207, rate: 0.015 }, { max: 2414, rate: 0.02 }, { max: 3621, rate: 0.025 }, { max: 4828, rate: 0.03 }, { max: 6035, rate: 0.035 }, { max: 7242, rate: 0.04 }, { max: 8449, rate: 0.045 }, { max: 9656, rate: 0.05 }, { max: Infinity, rate: 0.048 }], standardDeduction: 21900 },
  MT: { name: 'Montana', hasIncomeTax: true, brackets: [{ max: 3600, rate: 0.01 }, { max: 6300, rate: 0.02 }, { max: 9700, rate: 0.03 }, { max: 13000, rate: 0.04 }, { max: 16800, rate: 0.05 }, { max: 21600, rate: 0.06 }, { max: Infinity, rate: 0.069 }], standardDeduction: 5510 },
  NE: { name: 'Nebraska', hasIncomeTax: true, brackets: [{ max: 3700, rate: 0.0246 }, { max: 22170, rate: 0.0351 }, { max: 35730, rate: 0.0501 }, { max: Infinity, rate: 0.0584 }], standardDeduction: 7900 },
  NV: { name: 'Nevada', hasIncomeTax: false },
  NH: { name: 'New Hampshire', hasIncomeTax: false },
  NJ: { name: 'New Jersey', hasIncomeTax: true, brackets: [{ max: 20000, rate: 0.014 }, { max: 35000, rate: 0.0175 }, { max: 40000, rate: 0.035 }, { max: 75000, rate: 0.05525 }, { max: 500000, rate: 0.0637 }, { max: 1000000, rate: 0.0897 }, { max: Infinity, rate: 0.1075 }] },
  NM: { name: 'New Mexico', hasIncomeTax: true, brackets: [{ max: 5500, rate: 0.017 }, { max: 11000, rate: 0.032 }, { max: 16000, rate: 0.047 }, { max: 210000, rate: 0.049 }, { max: Infinity, rate: 0.059 }], standardDeduction: 14600 },
  NY: { name: 'New York', hasIncomeTax: true, brackets: [{ max: 17150, rate: 0.04 }, { max: 23600, rate: 0.045 }, { max: 27900, rate: 0.0525 }, { max: 161550, rate: 0.0585 }, { max: 323200, rate: 0.0625 }, { max: 2155350, rate: 0.0685 }, { max: 5000000, rate: 0.0965 }, { max: 25000000, rate: 0.103 }, { max: Infinity, rate: 0.109 }], standardDeduction: 8000 },
  NC: { name: 'North Carolina', hasIncomeTax: true, flatRate: 0.045 },
  ND: { name: 'North Dakota', hasIncomeTax: true, brackets: [{ max: 44725, rate: 0.011 }, { max: 225975, rate: 0.0204 }, { max: Infinity, rate: 0.029 }] },
  OH: { name: 'Ohio', hasIncomeTax: true, brackets: [{ max: 26050, rate: 0 }, { max: 100000, rate: 0.0275 }, { max: Infinity, rate: 0.035 }] },
  OK: { name: 'Oklahoma', hasIncomeTax: true, brackets: [{ max: 1000, rate: 0.0025 }, { max: 2500, rate: 0.0075 }, { max: 3750, rate: 0.0175 }, { max: 4900, rate: 0.0275 }, { max: 7200, rate: 0.0375 }, { max: Infinity, rate: 0.0475 }], standardDeduction: 6350 },
  OR: { name: 'Oregon', hasIncomeTax: true, brackets: [{ max: 10200, rate: 0.0475 }, { max: 25500, rate: 0.0675 }, { max: 125000, rate: 0.0875 }, { max: Infinity, rate: 0.099 }], standardDeduction: 2420 },
  PA: { name: 'Pennsylvania', hasIncomeTax: true, flatRate: 0.0307 },
  RI: { name: 'Rhode Island', hasIncomeTax: true, brackets: [{ max: 77450, rate: 0.0375 }, { max: 176050, rate: 0.0475 }, { max: Infinity, rate: 0.0599 }], standardDeduction: 10550 },
  SC: { name: 'South Carolina', hasIncomeTax: true, flatRate: 0.064 },
  SD: { name: 'South Dakota', hasIncomeTax: false },
  TN: { name: 'Tennessee', hasIncomeTax: false },
  TX: { name: 'Texas', hasIncomeTax: false },
  UT: { name: 'Utah', hasIncomeTax: true, flatRate: 0.0465 },
  VT: { name: 'Vermont', hasIncomeTax: true, brackets: [{ max: 45400, rate: 0.0335 }, { max: 110650, rate: 0.066 }, { max: 229550, rate: 0.076 }, { max: Infinity, rate: 0.0875 }], standardDeduction: 7000 },
  VA: { name: 'Virginia', hasIncomeTax: true, brackets: [{ max: 3000, rate: 0.02 }, { max: 5000, rate: 0.03 }, { max: 17000, rate: 0.05 }, { max: Infinity, rate: 0.0575 }], standardDeduction: 4500 },
  WA: { name: 'Washington', hasIncomeTax: false },
  WV: { name: 'West Virginia', hasIncomeTax: true, brackets: [{ max: 10000, rate: 0.03 }, { max: 25000, rate: 0.04 }, { max: 40000, rate: 0.045 }, { max: 60000, rate: 0.06 }, { max: Infinity, rate: 0.065 }] },
  WI: { name: 'Wisconsin', hasIncomeTax: true, brackets: [{ max: 14320, rate: 0.035 }, { max: 28640, rate: 0.044 }, { max: 315310, rate: 0.053 }, { max: Infinity, rate: 0.0765 }], standardDeduction: 12490 },
  WY: { name: 'Wyoming', hasIncomeTax: false },
  DC: { name: 'Washington D.C.', hasIncomeTax: true, brackets: [{ max: 10000, rate: 0.04 }, { max: 40000, rate: 0.06 }, { max: 60000, rate: 0.065 }, { max: 250000, rate: 0.085 }, { max: 500000, rate: 0.0925 }, { max: 1000000, rate: 0.0975 }, { max: Infinity, rate: 0.1075 }], standardDeduction: 14600 },
};

export const FILING_STATUS_LABELS: Record<string, string> = {
  single: 'Single',
  mfj: 'Married Filing Jointly',
  mfs: 'Married Filing Separately',
  hoh: 'Head of Household',
};

export const PAY_FREQUENCY_LABELS: Record<string, string> = {
  weekly: 'Weekly (52×/yr)',
  biweekly: 'Bi-weekly (26×/yr)',
  semimonthly: 'Semi-monthly (24×/yr)',
  monthly: 'Monthly (12×/yr)',
};
