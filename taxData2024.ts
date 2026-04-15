// Tax Year 2024 Data
// Sources: IRS Rev. Proc. 2023-34, IRS Publication 15-T, state revenue departments

export type FilingStatus = 'single' | 'mfj' | 'mfs' | 'hoh';

export interface TaxBracket {
  min: number;
  max: number | null; // null = no upper limit
  rate: number;
}

// 2024 Federal Income Tax Brackets
export const FEDERAL_BRACKETS: Record<FilingStatus, TaxBracket[]> = {
  single: [
    { min: 0,       max: 11600,   rate: 0.10 },
    { min: 11600,   max: 47150,   rate: 0.12 },
    { min: 47150,   max: 100525,  rate: 0.22 },
    { min: 100525,  max: 191950,  rate: 0.24 },
    { min: 191950,  max: 243725,  rate: 0.32 },
    { min: 243725,  max: 609350,  rate: 0.35 },
    { min: 609350,  max: null,    rate: 0.37 },
  ],
  mfj: [
    { min: 0,       max: 23200,   rate: 0.10 },
    { min: 23200,   max: 94300,   rate: 0.12 },
    { min: 94300,   max: 201050,  rate: 0.22 },
    { min: 201050,  max: 383900,  rate: 0.24 },
    { min: 383900,  max: 487450,  rate: 0.32 },
    { min: 487450,  max: 731200,  rate: 0.35 },
    { min: 731200,  max: null,    rate: 0.37 },
  ],
  mfs: [
    { min: 0,       max: 11600,   rate: 0.10 },
    { min: 11600,   max: 47150,   rate: 0.12 },
    { min: 47150,   max: 100525,  rate: 0.22 },
    { min: 100525,  max: 191950,  rate: 0.24 },
    { min: 191950,  max: 243725,  rate: 0.32 },
    { min: 243725,  max: 365600,  rate: 0.35 },
    { min: 365600,  max: null,    rate: 0.37 },
  ],
  hoh: [
    { min: 0,       max: 16550,   rate: 0.10 },
    { min: 16550,   max: 63100,   rate: 0.12 },
    { min: 63100,   max: 100500,  rate: 0.22 },
    { min: 100500,  max: 191950,  rate: 0.24 },
    { min: 191950,  max: 243700,  rate: 0.32 },
    { min: 243700,  max: 609350,  rate: 0.35 },
    { min: 609350,  max: null,    rate: 0.37 },
  ],
};

// 2024 Standard Deductions
export const STANDARD_DEDUCTION: Record<FilingStatus, number> = {
  single: 14600,
  mfj:    29200,
  mfs:    14600,
  hoh:    21900,
};

// 2024 Contribution Limits
export const CONTRIBUTION_LIMITS = {
  k401_under50:  23000,
  k401_catchup:  30500, // age 50+
  ira_under50:   7000,
  ira_catchup:   8000,  // age 50+
  hsa_self:      4150,
  hsa_family:    8300,
  hsa_catchup:   1000,  // age 55+
  fsa:           3200,
  dep_care_fsa:  5000,
};

// 2024 NIIT / Medicare Surtax Thresholds (not indexed for inflation)
export const SURTAX_THRESHOLDS: Record<FilingStatus, number> = {
  single: 200000,
  mfj:    250000,
  mfs:    125000,
  hoh:    200000,
};

// 2024 Roth IRA Phaseout Ranges
export const ROTH_PHASEOUT: Record<FilingStatus, { start: number; end: number } | null> = {
  single: { start: 146000, end: 161000 },
  mfj:    { start: 230000, end: 240000 },
  mfs:    { start: 0,      end: 10000  },
  hoh:    { start: 146000, end: 161000 },
};

// RSU Supplemental Withholding Rate
export const RSU_WITHHOLDING_RATE_STANDARD = 0.22;  // flat rate for supplemental wages up to $1M
export const RSU_WITHHOLDING_RATE_HIGH      = 0.37;  // mandatory for supplemental wages over $1M

// State Income Tax Rates (flat or effective rate for simplicity; some states are progressive)
// 0 = no state income tax
// For progressive states, this is the top marginal rate that high earners reach
export interface StateTaxInfo {
  name: string;
  rate: number;    // top marginal rate (or flat rate)
  hasLocalTax?: boolean;
  localTaxNote?: string;
}

export const STATE_TAX: Record<string, StateTaxInfo> = {
  AL: { name: 'Alabama',          rate: 0.05   },
  AK: { name: 'Alaska',           rate: 0.00   },
  AZ: { name: 'Arizona',          rate: 0.025  },
  AR: { name: 'Arkansas',         rate: 0.047  },
  CA: { name: 'California',       rate: 0.133  },
  CO: { name: 'Colorado',         rate: 0.044  },
  CT: { name: 'Connecticut',      rate: 0.0699 },
  DE: { name: 'Delaware',         rate: 0.066  },
  FL: { name: 'Florida',          rate: 0.00   },
  GA: { name: 'Georgia',          rate: 0.055  },
  HI: { name: 'Hawaii',           rate: 0.11   },
  ID: { name: 'Idaho',            rate: 0.058  },
  IL: { name: 'Illinois',         rate: 0.0495 },
  IN: { name: 'Indiana',          rate: 0.0305 },
  IA: { name: 'Iowa',             rate: 0.057  },
  KS: { name: 'Kansas',           rate: 0.057  },
  KY: { name: 'Kentucky',         rate: 0.045  },
  LA: { name: 'Louisiana',        rate: 0.06   },
  ME: { name: 'Maine',            rate: 0.0715 },
  MD: { name: 'Maryland',         rate: 0.0575, hasLocalTax: true, localTaxNote: 'County tax of 2.25–3.20% applies' },
  MA: { name: 'Massachusetts',    rate: 0.09   },
  MI: { name: 'Michigan',         rate: 0.0425 },
  MN: { name: 'Minnesota',        rate: 0.0985 },
  MS: { name: 'Mississippi',      rate: 0.047  },
  MO: { name: 'Missouri',         rate: 0.048  },
  MT: { name: 'Montana',          rate: 0.069  },
  NE: { name: 'Nebraska',         rate: 0.0664 },
  NV: { name: 'Nevada',           rate: 0.00   },
  NH: { name: 'New Hampshire',    rate: 0.00   },
  NJ: { name: 'New Jersey',       rate: 0.1075 },
  NM: { name: 'New Mexico',       rate: 0.059  },
  NY: { name: 'New York',         rate: 0.109,  hasLocalTax: true, localTaxNote: 'NYC residents pay additional city tax up to 3.876%' },
  NC: { name: 'North Carolina',   rate: 0.045  },
  ND: { name: 'North Dakota',     rate: 0.025  },
  OH: { name: 'Ohio',             rate: 0.035  },
  OK: { name: 'Oklahoma',         rate: 0.05   },
  OR: { name: 'Oregon',           rate: 0.099  },
  PA: { name: 'Pennsylvania',     rate: 0.0307 },
  RI: { name: 'Rhode Island',     rate: 0.0599 },
  SC: { name: 'South Carolina',   rate: 0.064  },
  SD: { name: 'South Dakota',     rate: 0.00   },
  TN: { name: 'Tennessee',        rate: 0.00   },
  TX: { name: 'Texas',            rate: 0.00   },
  UT: { name: 'Utah',             rate: 0.0465 },
  VT: { name: 'Vermont',          rate: 0.0875 },
  VA: { name: 'Virginia',         rate: 0.0575 },
  WA: { name: 'Washington',       rate: 0.00   },
  WV: { name: 'West Virginia',    rate: 0.065  },
  WI: { name: 'Wisconsin',        rate: 0.0765 },
  WY: { name: 'Wyoming',          rate: 0.00   },
  DC: { name: 'Washington D.C.',  rate: 0.1075 },
};

// Child Tax Credit (2024)
export const CHILD_TAX_CREDIT_PER_CHILD = 2000;
export const CHILD_TAX_CREDIT_PHASEOUT_SINGLE = 200000;
export const CHILD_TAX_CREDIT_PHASEOUT_MFJ    = 400000;

export const TAX_YEAR = 2024;
