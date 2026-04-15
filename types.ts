import { FilingStatus } from './taxData2024';

export type { FilingStatus };

export interface TaxInputs {
  grossIncome: number;           // Annual salary + bonus, pre-equity
  filingStatus: FilingStatus;
  rsuShares: number;             // Shares vested (0 if none)
  rsuVestPrice: number;          // FMV per share at vest
  stateCode: string;             // e.g. 'CA', 'TX'
  dependents: number;            // Number of qualifying dependents
  age: number;                   // Taxpayer age
  existing401k: number;          // Pre-tax 401(k) already contributed this year
}

export interface TaxBreakdownItem {
  label: string;
  amount: number;
  rate?: number;
}

export interface TaxResult {
  totalIncome: number;           // grossIncome + RSU income
  rsuIncome: number;
  taxableIncome: number;         // After standard deduction
  federalTax: number;
  stateTax: number;
  niit: number;                  // Net Investment Income Tax (3.8%)
  additionalMedicareTax: number; // 0.9% above threshold
  totalTax: number;
  effectiveRate: number;         // totalTax / totalIncome
  marginalRate: number;          // Top federal bracket rate hit
  marginalRateLabel: string;     // e.g. "37%"
  rsuWithholdingGap: number;     // Amount likely under-withheld on RSUs
  stateHasLocalTax: boolean;
  stateLocalTaxNote: string;
  breakdown: TaxBreakdownItem[];
}

export interface TaxStrategy {
  id: string;
  title: string;
  description: string;           // Static description (shown before AI narrative loads)
  estimatedSavings: number;      // Annual tax savings in dollars
  priority: 'high' | 'medium' | 'low';
  category: 'retirement' | 'equity' | 'investment' | 'family' | 'charitable';
  isWarning?: boolean;           // True for withholding gap alerts
  narrative?: string;            // AI-generated personalized explanation (loaded async)
}

export interface AppState {
  step: 'input' | 'calculating' | 'results';
  inputs: TaxInputs | null;
  taxResult: TaxResult | null;
  strategies: TaxStrategy[];
  error: string | null;
}
