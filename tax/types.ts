export type FilingStatus = 'single' | 'mfj' | 'mfs' | 'hoh';
export type PayFrequency = 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';

export interface JobEntry {
  id: string;
  label: string;
  grossPayPerPeriod: number;
  payFrequency: PayFrequency;
  withholdingPerPeriod: number;
}

export interface OtherDeduction {
  id: string;
  label: string;
  annualAmount: number;
}

export interface TaxInputs {
  filingStatus: FilingStatus;
  state: string;
  numJobs: number;
  jobs: JobEntry[];
  qualifyingChildren: number;
  otherDependents: number;
  annual401k: number;
  annualFSA: number;
  annualHSA: number;
  otherDeductions: OtherDeduction[];
  hasSelfEmployment: boolean;
  netSEIncome: number;
}

export interface BracketResult {
  rate: number;
  taxableInBracket: number;
  taxInBracket: number;
}

export interface TaxResults {
  totalW2Income: number;
  totalPreTaxDeductions: number;
  seTax: number;
  seTaxDeduction: number;
  agi: number;
  standardDeduction: number;
  taxableIncome: number;
  federalIncomeTax: number;
  bracketBreakdown: BracketResult[];
  childTaxCredit: number;
  otherDependentCredit: number;
  totalFederalTax: number;
  totalWithheld: number;
  federalUnderpayment: number;
  quarterlyFederalPayment: number;
  estimatedStateTax: number;
  stateWithholdingNote: string;
  quarterlyStatePayment: number;
  marginalRate: number;
}

export type Step = 1 | 2 | 3;
