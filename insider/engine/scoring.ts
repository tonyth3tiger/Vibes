// Composite scoring: turns raw detector signals into ranked wallet alerts
// (surveillance feed) and market recommendations (follow-the-money feed).

import {
  EngineResult,
  MarketData,
  MarketRecommendation,
  Signal,
  SignalKind,
  WalletAlert,
} from '../types';
import { runDetectors, walletNetPositions } from './detectors';

/** How strongly each signal kind indicates insider-style behavior. */
export const SIGNAL_WEIGHTS: Record<SignalKind, number> = {
  'fresh-wallet': 1.0,
  'size-outlier': 0.7,
  'flow-burst': 0.8,
  'price-spike': 0.6,
  'smart-money': 0.75,
};

export const SIGNAL_LABELS: Record<SignalKind, string> = {
  'fresh-wallet': 'Fresh wallet',
  'size-outlier': 'Size outlier',
  'flow-burst': 'Flow burst',
  'price-spike': 'Price spike',
  'smart-money': 'Smart money',
};

/**
 * Combine independent signal strengths into one score via noisy-OR:
 * score = 1 - Π(1 - wᵢ·sᵢ). Adding evidence only ever raises the score,
 * and no single weak signal can dominate.
 */
export function combineSignals(signals: Signal[]): number {
  let miss = 1;
  for (const s of signals) miss *= 1 - SIGNAL_WEIGHTS[s.kind] * s.score;
  return 1 - miss;
}

const MIN_ALERT_SCORE = 0.3;
const MIN_RECOMMENDATION_CONFIDENCE = 0.35;

export function analyzeMarkets(datasets: MarketData[], now = Date.now() / 1000): EngineResult {
  const alerts: WalletAlert[] = [];
  const recommendations: MarketRecommendation[] = [];

  for (const data of datasets) {
    const signals = runDetectors(data, now);
    if (signals.length === 0) continue;
    const positions = walletNetPositions(data.trades);

    // --- Wallet alerts: group wallet-attributable signals per wallet ---
    const byWallet = new Map<string, Signal[]>();
    for (const s of signals) {
      if (!s.wallet) continue;
      const arr = byWallet.get(s.wallet) ?? [];
      arr.push(s);
      byWallet.set(s.wallet, arr);
    }
    for (const [wallet, walletSignals] of byWallet) {
      const score = combineSignals(walletSignals);
      if (score < MIN_ALERT_SCORE) continue;
      const pos = positions.get(wallet);
      alerts.push({
        wallet,
        pseudonym: data.walletProfiles[wallet]?.pseudonym,
        marketId: data.market.id,
        marketQuestion: data.market.question,
        direction: pos?.direction ?? walletSignals[0].direction ?? 'YES',
        totalUsd: pos?.totalUsd ?? 0,
        signals: walletSignals.sort((a, b) => b.score - a.score),
        score,
      });
    }

    // --- Market recommendation: aggregate directional signals ---
    const directional = signals.filter((s) => s.direction);
    if (directional.length === 0) continue;
    const usdByDirection = { YES: 0, NO: 0 };
    for (const s of directional) {
      // Weight direction votes by signal strength; wallet signals also carry notional.
      const notional = s.wallet ? positions.get(s.wallet)?.totalUsd ?? 0 : 0;
      usdByDirection[s.direction!] += s.score * (1 + notional / 10_000);
    }
    const direction: 'YES' | 'NO' = usdByDirection.YES >= usdByDirection.NO ? 'YES' : 'NO';
    const supporting = directional.filter((s) => s.direction === direction);
    const confidence = combineSignals(supporting);
    if (confidence < MIN_RECOMMENDATION_CONFIDENCE) continue;

    recommendations.push({
      market: data.market,
      direction,
      confidence,
      rationale: supporting
        .sort((a, b) => SIGNAL_WEIGHTS[b.kind] * b.score - SIGNAL_WEIGHTS[a.kind] * a.score)
        .map((s) => s.evidence),
      signals: supporting,
      priceHistory: data.priceHistory,
    });
  }

  alerts.sort((a, b) => b.score - a.score);
  recommendations.sort((a, b) => b.confidence - a.confidence);
  return { alerts, recommendations, generatedAt: now };
}
