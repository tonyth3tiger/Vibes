import {
  FEDERAL_BRACKETS,
  STANDARD_DEDUCTION,
  STATE_TAX,
  SURTAX_THRESHOLDS,
  RSU_WITHHOLDING_RATE_STANDARD,
  RSU_WITHHOLDING_RATE_HIGH,
  CHILD_TAX_CREDIT_PER_CHILD,
  CHILD_TAX_CREDIT_PHASEOUT_SINGLE,
  CHILD_TAX_CREDIT_PHASEOUT_MFJ,
  FilingStatus,
} from './taxData2024';
import { TaxInputs, TaxResult, TaxBreakdownItem } from './types';

function calcProgressiveTax(taxableIncome: number, brackets: typeof FEDERAL_BRACKETS['single']): number {
  let tax = 0;
  for (const bracket of brackets) {
    if (taxableIncome <= bracket.min) break;
    const top = bracket.max ?? Infinity;
    const amountInBracket = Math.min(taxableIncome, top) - bracket.min;
    tax += amountInBracket * bracket.rate;
  }
  return tax;
}

function getMarginalRate(taxableIncome: number, filingStatus: FilingStatus): number {
  const brackets = FEDERAL_BRACKETS[filingStatus];
  let marginal = brackets[0].rate;
  for (const bracket of brackets) {
    if (taxableIncome > bracket.min) {
      marginal = bracket.rate;
    }
  }
  return marginal;
}

function calcChildTaxCredit(dependents: number, totalIncome: number, filingStatus: FilingStatus): number {
  if (dependents === 0) return 0;
  const baseCredit = dependents * CHILD_TAX_CREDIT_PER_CHILD;
  const threshold = filingStatus === 'mfj'
    ? CHILD_TAX_CREDIT_PHASEOUT_MFJ
    : CHILD_TAX_CREDIT_PHASEOUT_SINGLE;
  if (totalIncome <= threshold) return baseCredit;
  // Phase out: $50 per $1,000 over threshold
  const excess = totalIncome - threshold;
  const reduction = Math.floor(excess / 1000) * 50;
  return Math.max(0, baseCredit - reduction);
}

export function calculateTax(inputs: TaxInputs): TaxResult {
  const { grossIncome, filingStatus, rsuShares, rsuVestPrice, stateCode, dependents, age, existing401k } = inputs;

  // RSU income (RSUs are ordinary income at vest)
  const rsuIncome = rsuShares * rsuVestPrice;
  const totalIncome = grossIncome + rsuIncome;

  // Standard deduction
  const standardDeduction = STANDARD_DEDUCTION[filingStatus];
  const taxableIncome = Math.max(0, totalIncome - standardDeduction);

  // Federal income tax
  const brackets = FEDERAL_BRACKETS[filingStatus];
  const federalTaxBeforeCredits = calcProgressiveTax(taxableIncome, brackets);

  // Child tax credit
  const childCredit = calcChildTaxCredit(dependents, totalIncome, filingStatus);
  const federalTax = Math.max(0, federalTaxBeforeCredits - childCredit);

  // State income tax (simplified: apply top marginal rate to full income)
  const stateInfo = STATE_TAX[stateCode] ?? { name: stateCode, rate: 0 };
  const stateTax = totalIncome * stateInfo.rate;

  // NIIT (3.8% on investment income above threshold; we model RSU income as going over threshold)
  // In practice NIIT applies to investment income, but high earners with RSUs often have other
  // investment income. We flag it if total income exceeds the threshold.
  const niitThreshold = SURTAX_THRESHOLDS[filingStatus];
  const niit = totalIncome > niitThreshold ? (totalIncome - niitThreshold) * 0.038 : 0;

  // Additional Medicare Tax (0.9% on wages above threshold)
  const additionalMedicareTax = totalIncome > niitThreshold ? (totalIncome - niitThreshold) * 0.009 : 0;

  const totalTax = federalTax + stateTax + niit + additionalMedicareTax;
  const effectiveRate = totalIncome > 0 ? totalTax / totalIncome : 0;
  const marginalRate = getMarginalRate(taxableIncome, filingStatus);

  // RSU withholding gap
  // Employers withhold 22% flat on supplemental wages (RSUs) up to $1M, then 37%
  // High earners paying 32–37% marginal federal rate may be under-withheld
  let rsuWithheld = 0;
  if (rsuIncome > 0) {
    const belowOneMillion = Math.min(rsuIncome, 1_000_000);
    const aboveOneMillion = Math.max(0, rsuIncome - 1_000_000);
    rsuWithheld = belowOneMillion * RSU_WITHHOLDING_RATE_STANDARD + aboveOneMillion * RSU_WITHHOLDING_RATE_HIGH;
  }
  // Actual federal tax owed on RSU income at marginal rate
  const rsuFederalOwed = rsuIncome * marginalRate;
  const rsuWithholdingGap = Math.max(0, rsuFederalOwed - rsuWithheld);

  const breakdown: TaxBreakdownItem[] = [
    { label: 'Federal Income Tax', amount: federalTax, rate: effectiveRate },
    { label: 'State Income Tax', amount: stateTax, rate: stateInfo.rate },
  ];
  if (niit > 0) {
    breakdown.push({ label: 'Net Investment Income Tax (3.8%)', amount: niit, rate: 0.038 });
  }
  if (additionalMedicareTax > 0) {
    breakdown.push({ label: 'Additional Medicare Tax (0.9%)', amount: additionalMedicareTax, rate: 0.009 });
  }
  if (childCredit > 0) {
    breakdown.push({ label: 'Child Tax Credit (applied)', amount: -childCredit });
  }

  return {
    totalIncome,
    rsuIncome,
    taxableIncome,
    federalTax,
    stateTax,
    niit,
    additionalMedicareTax,
    totalTax,
    effectiveRate,
    marginalRate,
    marginalRateLabel: `${Math.round(marginalRate * 100)}%`,
    rsuWithholdingGap,
    stateHasLocalTax: stateInfo.hasLocalTax ?? false,
    stateLocalTaxNote: stateInfo.localTaxNote ?? '',
    breakdown,
  };
}
