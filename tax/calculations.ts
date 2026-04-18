import { TaxInputs, TaxResults, BracketResult, FilingStatus } from './types';
import {
  PAY_PERIODS,
  FEDERAL_BRACKETS,
  STANDARD_DEDUCTIONS,
  CTC_PHASEOUT_THRESHOLD,
  STATE_TAX_DATA,
} from './taxData';

function calcBracketTax(taxableIncome: number, status: FilingStatus): { tax: number; breakdown: BracketResult[]; marginalRate: number } {
  const brackets = FEDERAL_BRACKETS[status];
  let remaining = taxableIncome;
  let prev = 0;
  let tax = 0;
  let marginalRate = 0;
  const breakdown: BracketResult[] = [];

  for (const bracket of brackets) {
    if (remaining <= 0) break;
    const size = bracket.max === Infinity ? remaining : Math.min(remaining, bracket.max - prev);
    const taxable = Math.max(0, size);
    const t = taxable * bracket.rate;
    if (taxable > 0) {
      breakdown.push({ rate: bracket.rate, taxableInBracket: taxable, taxInBracket: t });
      marginalRate = bracket.rate;
    }
    tax += t;
    remaining -= taxable;
    prev = bracket.max;
  }

  return { tax, breakdown, marginalRate };
}

function calcStateTax(agi: number, state: string): number {
  const info = STATE_TAX_DATA[state];
  if (!info || !info.hasIncomeTax) return 0;

  const deduction = info.standardDeduction ?? 0;
  const taxable = Math.max(0, agi - deduction);

  if (info.flatRate !== undefined) {
    return taxable * info.flatRate;
  }

  if (info.brackets) {
    let prev = 0;
    let tax = 0;
    let rem = taxable;
    for (const b of info.brackets) {
      if (rem <= 0) break;
      const size = b.max === Infinity ? rem : Math.min(rem, b.max - prev);
      tax += Math.max(0, size) * b.rate;
      rem -= size;
      prev = b.max;
    }
    return tax;
  }

  return 0;
}

export function computeResults(inputs: TaxInputs): TaxResults {
  const { filingStatus, state, jobs, qualifyingChildren, otherDependents,
    annual401k, annualFSA, annualHSA, otherDeductions,
    hasSelfEmployment, netSEIncome } = inputs;

  // Step 1: Annualize W-2 income
  const totalW2Income = jobs.reduce((sum, job) => {
    const periods = PAY_PERIODS[job.payFrequency] ?? 26;
    return sum + job.grossPayPerPeriod * periods;
  }, 0);

  // Step 2: SE tax
  const seTax = hasSelfEmployment ? netSEIncome * 0.9235 * 0.153 : 0;
  const seTaxDeduction = seTax / 2;

  // Step 3: Pre-tax deductions
  const otherDeductionTotal = otherDeductions.reduce((s, d) => s + d.annualAmount, 0);
  const totalPreTaxDeductions = annual401k + annualFSA + annualHSA + otherDeductionTotal;

  // Step 4: AGI
  const agi = Math.max(0, totalW2Income + (hasSelfEmployment ? netSEIncome : 0) - totalPreTaxDeductions - seTaxDeduction);

  // Step 5: Taxable income
  const standardDeduction = STANDARD_DEDUCTIONS[filingStatus];
  const taxableIncome = Math.max(0, agi - standardDeduction);

  // Step 6: Federal income tax
  const { tax: federalIncomeTax, breakdown: bracketBreakdown, marginalRate } = calcBracketTax(taxableIncome, filingStatus);

  // Step 7: Child Tax Credit
  const ctcThreshold = CTC_PHASEOUT_THRESHOLD[filingStatus];
  const ctcExcess = Math.max(0, agi - ctcThreshold);
  const ctcReduction = Math.floor(ctcExcess / 1000) * 50;
  const grossCTC = qualifyingChildren * 2000;
  const childTaxCredit = Math.max(0, grossCTC - ctcReduction);

  // Step 8: Other Dependent Credit
  const otherDependentCredit = otherDependents * 500;

  // Step 9: Total federal tax
  const totalFederalTax = Math.max(0, federalIncomeTax + seTax - childTaxCredit - otherDependentCredit);

  // Step 10: Total withheld
  const totalWithheld = jobs.reduce((sum, job) => {
    const periods = PAY_PERIODS[job.payFrequency] ?? 26;
    return sum + job.withholdingPerPeriod * periods;
  }, 0);

  // Step 11: Underpayment & quarterly payment
  const federalUnderpayment = totalFederalTax - totalWithheld;
  const quarterlyFederalPayment = Math.max(0, federalUnderpayment) / 4;

  // Step 12: State tax
  const estimatedStateTax = calcStateTax(agi, state);
  const stateInfo = STATE_TAX_DATA[state];
  const stateWithholdingNote = stateInfo?.hasIncomeTax
    ? `Estimated ${stateInfo.name} income tax. State estimated payments go to your state's revenue department, not the IRS.`
    : `${stateInfo?.name ?? state} has no state income tax.`;
  const quarterlyStatePayment = estimatedStateTax / 4;

  return {
    totalW2Income,
    totalPreTaxDeductions,
    seTax,
    seTaxDeduction,
    agi,
    standardDeduction,
    taxableIncome,
    federalIncomeTax,
    bracketBreakdown,
    childTaxCredit,
    otherDependentCredit,
    totalFederalTax,
    totalWithheld,
    federalUnderpayment,
    quarterlyFederalPayment,
    estimatedStateTax,
    stateWithholdingNote,
    quarterlyStatePayment,
    marginalRate,
  };
}
