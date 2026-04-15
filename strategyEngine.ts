import { TaxInputs, TaxResult, TaxStrategy } from './types';
import {
  CONTRIBUTION_LIMITS,
  ROTH_PHASEOUT,
  SURTAX_THRESHOLDS,
  STANDARD_DEDUCTION,
} from './taxData2024';

export function generateStrategies(inputs: TaxInputs, result: TaxResult): TaxStrategy[] {
  const strategies: TaxStrategy[] = [];
  const { filingStatus, age, existing401k, dependents, rsuShares } = inputs;
  const { marginalRate, totalIncome, federalTax, rsuWithholdingGap, rsuIncome } = result;

  // ── 1. RSU Withholding Gap Warning ────────────────────────────────────────
  if (rsuShares > 0 && rsuWithholdingGap > 500) {
    strategies.push({
      id: 'rsu-withholding-gap',
      title: 'RSU Under-Withholding Alert',
      description:
        `Your employer likely withheld only 22% on your RSU income, but your marginal federal rate is ${result.marginalRateLabel}. ` +
        `You may owe an additional ~$${Math.round(rsuWithholdingGap).toLocaleString()} in taxes this April. ` +
        `Consider making estimated tax payments to avoid an underpayment penalty.`,
      estimatedSavings: rsuWithholdingGap * 0.05, // savings = avoiding ~5% underpayment penalty
      priority: 'high',
      category: 'equity',
      isWarning: true,
    });
  }

  // ── 2. 401(k) Contribution Optimization ──────────────────────────────────
  const maxK401 = age >= 50 ? CONTRIBUTION_LIMITS.k401_catchup : CONTRIBUTION_LIMITS.k401_under50;
  const k401Headroom = Math.max(0, maxK401 - existing401k);
  if (k401Headroom > 0) {
    const savings = Math.round(k401Headroom * marginalRate);
    strategies.push({
      id: '401k-optimization',
      title: `Maximize 401(k) Contributions`,
      description:
        `You have $${k401Headroom.toLocaleString()} of unused 401(k) contribution room. ` +
        `At your ${result.marginalRateLabel} marginal rate, contributing the full ${age >= 50 ? 'catch-up' : ''} limit ` +
        `of $${maxK401.toLocaleString()} could reduce your federal tax bill by ~$${savings.toLocaleString()} this year.`,
      estimatedSavings: savings,
      priority: k401Headroom > 10000 ? 'high' : 'medium',
      category: 'retirement',
    });
  }

  // ── 3. Backdoor Roth IRA ──────────────────────────────────────────────────
  const phaseout = ROTH_PHASEOUT[filingStatus];
  const isAboveRothLimit = phaseout && totalIncome >= phaseout.end;
  const maxIRA = age >= 50 ? CONTRIBUTION_LIMITS.ira_catchup : CONTRIBUTION_LIMITS.ira_under50;
  if (isAboveRothLimit) {
    // No direct Roth, but Backdoor Roth is available. Savings = tax-free growth (hard to quantify annually)
    // We estimate savings as marginal rate * IRA amount (representing tax-deferred growth value)
    const savings = Math.round(maxIRA * marginalRate * 0.5); // conservative estimate
    strategies.push({
      id: 'backdoor-roth',
      title: 'Backdoor Roth IRA',
      description:
        `Your income exceeds the Roth IRA limit ($${phaseout.end.toLocaleString()} for ${filingStatus === 'mfj' ? 'MFJ' : 'single'}). ` +
        `You can still contribute $${maxIRA.toLocaleString()} via a Backdoor Roth: make a non-deductible traditional IRA contribution, ` +
        `then immediately convert it to Roth. Future growth and qualified withdrawals are tax-free.`,
      estimatedSavings: savings,
      priority: 'high',
      category: 'retirement',
    });
  } else if (!phaseout || totalIncome < phaseout.start) {
    // Eligible for direct Roth IRA
    strategies.push({
      id: 'roth-ira',
      title: 'Roth IRA Contribution',
      description:
        `You are eligible to contribute up to $${maxIRA.toLocaleString()} directly to a Roth IRA. ` +
        `Contributions grow tax-free and qualified withdrawals in retirement are not taxed. ` +
        (age >= 50 ? 'The catch-up limit applies since you are 50 or older.' : ''),
      estimatedSavings: Math.round(maxIRA * marginalRate * 0.3),
      priority: 'medium',
      category: 'retirement',
    });
  }

  // ── 4. HSA (Triple Tax Advantage) ────────────────────────────────────────
  const hsaLimit = filingStatus === 'mfj' || dependents > 0
    ? CONTRIBUTION_LIMITS.hsa_family + (age >= 55 ? CONTRIBUTION_LIMITS.hsa_catchup : 0)
    : CONTRIBUTION_LIMITS.hsa_self + (age >= 55 ? CONTRIBUTION_LIMITS.hsa_catchup : 0);
  const hsaSavings = Math.round(hsaLimit * marginalRate);
  strategies.push({
    id: 'hsa',
    title: 'Health Savings Account (HSA)',
    description:
      `If you are enrolled in a High-Deductible Health Plan (HDHP), you can contribute up to $${hsaLimit.toLocaleString()} to an HSA. ` +
      `HSAs offer a triple tax advantage: contributions are pre-tax, growth is tax-free, and withdrawals for medical expenses are tax-free. ` +
      `At your marginal rate, this could save ~$${hsaSavings.toLocaleString()} in taxes.`,
    estimatedSavings: hsaSavings,
    priority: 'high',
    category: 'retirement',
  });

  // ── 5. Tax-Loss Harvesting ────────────────────────────────────────────────
  const niitThreshold = SURTAX_THRESHOLDS[filingStatus];
  if (totalIncome > niitThreshold * 0.8) {
    strategies.push({
      id: 'tax-loss-harvesting',
      title: 'Tax-Loss Harvesting',
      description:
        `At your income level, investment gains may be subject to both long-term capital gains rates and the 3.8% Net Investment Income Tax. ` +
        `Selling underperforming investments to realize losses can offset gains dollar-for-dollar. ` +
        `Up to $3,000 of net losses can also offset ordinary income annually, with the remainder carried forward.`,
      estimatedSavings: 3000 * marginalRate, // conservative: $3k offset at marginal rate
      priority: 'medium',
      category: 'investment',
    });
  }

  // ── 6. 529 Education Savings (if dependents) ─────────────────────────────
  if (dependents > 0) {
    // Federal: no deduction, but some states offer deductions (we flag it generically)
    strategies.push({
      id: '529-plan',
      title: '529 Education Savings Plan',
      description:
        `With ${dependents} dependent${dependents > 1 ? 's' : ''}, a 529 plan lets you invest for education expenses with tax-free growth. ` +
        `Many states also offer a state income tax deduction for contributions. ` +
        `Superfunding allows a lump-sum contribution of up to $90,000 (5-year gift tax election) per beneficiary.`,
      estimatedSavings: Math.round(5000 * result.stateTax / (result.totalIncome || 1)), // rough state deduction estimate
      priority: 'medium',
      category: 'family',
    });
  }

  // ── 7. Charitable DAF Bunching ────────────────────────────────────────────
  const standardDed = STANDARD_DEDUCTION[filingStatus];
  // Worth bunching if they're near or over standard deduction with charitable giving
  strategies.push({
    id: 'daf-bunching',
    title: 'Donor-Advised Fund (DAF) + Deduction Bunching',
    description:
      `The standard deduction for ${filingStatus === 'mfj' ? 'MFJ' : filingStatus === 'single' ? 'single filers' : 'your filing status'} ` +
      `is $${standardDed.toLocaleString()} in 2024. If you give to charity, "bunching" multiple years of donations into one year ` +
      `via a Donor-Advised Fund lets you take the itemized deduction in that year while distributing grants over time. ` +
      `This can convert an otherwise non-deductible donation into a meaningful tax benefit.`,
    estimatedSavings: Math.round(10000 * marginalRate), // assuming $10k charitable giving example
    priority: 'low',
    category: 'charitable',
  });

  // Sort: warnings first, then by estimatedSavings descending
  return strategies.sort((a, b) => {
    if (a.isWarning && !b.isWarning) return -1;
    if (!a.isWarning && b.isWarning) return 1;
    return b.estimatedSavings - a.estimatedSavings;
  });
}
