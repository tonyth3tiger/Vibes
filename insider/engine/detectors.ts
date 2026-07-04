// Anomaly detectors for insider-style trading patterns.
//
// Each detector is a pure function over MarketData that returns zero or more
// Signals with a strength in [0, 1] and human-readable evidence. Detectors
// never prove insider trading — they flag behavior statistically consistent
// with informed trading so a human can investigate.

import { MarketData, Signal, Trade, WalletProfile } from '../types';

export const THRESHOLDS = {
  /** A wallet younger than this (seconds) counts as "fresh" */
  freshWalletMaxAgeSec: 7 * 24 * 3600,
  /** Fresh wallet must have essentially no history beyond this market */
  freshWalletMaxLifetimeTrades: 8,
  /** Minimum notional (USD) for a fresh-wallet position to matter */
  freshWalletMinUsd: 2_000,
  /** Notional at which the fresh-wallet score saturates */
  freshWalletSaturationUsd: 50_000,

  /** z-score at which a single trade counts as a size outlier */
  sizeOutlierMinZ: 3,
  /** Minimum notional for a size outlier, regardless of z */
  sizeOutlierMinUsd: 1_000,

  /** Sliding window for one-sided flow bursts (seconds) */
  flowBurstWindowSec: 30 * 60,
  /** Net one-sided flow must exceed this fraction of 24h volume */
  flowBurstMinVolumeFraction: 0.05,
  /** ...and at least this notional */
  flowBurstMinUsd: 5_000,

  /** Absolute YES-price move that counts as a spike */
  priceSpikeMinMove: 0.1,
  /** Window in which the move must happen (seconds) */
  priceSpikeWindowSec: 2 * 3600,

  /** Minimum resolved markets before a win rate is trusted */
  smartMoneyMinResolved: 10,
  /** Win rate above which a wallet counts as smart money */
  smartMoneyMinWinRate: 0.7,
  /** Minimum new-position notional for a smart-money signal */
  smartMoneyMinUsd: 5_000,
} as const;

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

const shortAddr = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

export const walletLabel = (address: string, pseudonym?: string) =>
  pseudonym ? `${pseudonym} (${shortAddr(address)})` : shortAddr(address);

const fmtUsd = (n: number) =>
  `$${n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k` : n.toFixed(0)}`;

/** Net position per wallet: outcome with larger notional and its total USD. */
export function walletNetPositions(
  trades: Trade[],
): Map<string, { direction: 'YES' | 'NO'; totalUsd: number; lastTs: number }> {
  const acc = new Map<string, { yes: number; no: number; lastTs: number }>();
  for (const t of trades) {
    const e = acc.get(t.wallet) ?? { yes: 0, no: 0, lastTs: 0 };
    // A SELL of YES is economically a bet on NO and vice versa.
    const yesNotional =
      (t.outcome === 'YES') === (t.side === 'BUY') ? t.usdcSize : -t.usdcSize;
    if (yesNotional >= 0) e.yes += yesNotional;
    else e.no += -yesNotional;
    e.lastTs = Math.max(e.lastTs, t.timestamp);
    acc.set(t.wallet, e);
  }
  const out = new Map<string, { direction: 'YES' | 'NO'; totalUsd: number; lastTs: number }>();
  for (const [wallet, e] of acc) {
    const direction = e.yes >= e.no ? 'YES' : 'NO';
    out.set(wallet, { direction, totalUsd: Math.max(e.yes, e.no), lastTs: e.lastTs });
  }
  return out;
}

/**
 * 1. Fresh-wallet large bet: a wallet with no meaningful history takes a big
 * one-sided position, especially close to resolution. This is the signature
 * pattern of real Polymarket insider cases.
 */
export function detectFreshWallets(data: MarketData, now: number): Signal[] {
  const signals: Signal[] = [];
  const positions = walletNetPositions(data.trades);
  const endTs = Date.parse(data.market.endDate) / 1000;

  for (const [wallet, pos] of positions) {
    const profile: WalletProfile | undefined = data.walletProfiles[wallet];
    if (!profile) continue;
    const ageSec = now - profile.firstSeen;
    if (ageSec > THRESHOLDS.freshWalletMaxAgeSec) continue;
    if (profile.tradeCount > THRESHOLDS.freshWalletMaxLifetimeTrades) continue;
    if (pos.totalUsd < THRESHOLDS.freshWalletMinUsd) continue;

    const sizeFactor = clamp01(pos.totalUsd / THRESHOLDS.freshWalletSaturationUsd);
    // Betting within 48h of resolution is more suspicious than a week out.
    const hoursToEnd = Math.max(0, (endTs - pos.lastTs) / 3600);
    const urgencyFactor = clamp01(1 - hoursToEnd / (14 * 24)) * 0.5 + 0.5;
    const score = clamp01(0.5 + 0.5 * sizeFactor) * urgencyFactor;

    const ageDays = Math.max(ageSec / 86_400, 0.04);
    signals.push({
      kind: 'fresh-wallet',
      score,
      evidence: `Wallet ${walletLabel(wallet, profile.pseudonym)} is ${
        ageDays < 1 ? `${Math.round(ageDays * 24)}h` : `${ageDays.toFixed(1)}d`
      } old with ${profile.tradeCount} lifetime trades, yet holds ${fmtUsd(pos.totalUsd)} of ${pos.direction}${
        hoursToEnd < 72 ? `, opened ~${Math.round(hoursToEnd)}h before resolution` : ''
      }`,
      marketId: data.market.id,
      wallet,
      direction: pos.direction,
      timestamp: pos.lastTs,
    });
  }
  return signals;
}

/**
 * 2. Size outlier: individual trades far outside the market's typical trade
 * size distribution (z-score on notional).
 */
export function detectSizeOutliers(data: MarketData): Signal[] {
  const { trades } = data;
  if (trades.length < 20) return [];
  const sizes = trades.map((t) => t.usdcSize);
  const mean = sizes.reduce((a, b) => a + b, 0) / sizes.length;
  const variance = sizes.reduce((a, b) => a + (b - mean) ** 2, 0) / sizes.length;
  const std = Math.sqrt(variance);
  if (std === 0) return [];

  const signals: Signal[] = [];
  for (const t of trades) {
    const z = (t.usdcSize - mean) / std;
    if (z < THRESHOLDS.sizeOutlierMinZ || t.usdcSize < THRESHOLDS.sizeOutlierMinUsd) continue;
    const score = clamp01(0.4 + (z - THRESHOLDS.sizeOutlierMinZ) / 8);
    signals.push({
      kind: 'size-outlier',
      score,
      evidence: `${fmtUsd(t.usdcSize)} ${t.side} of ${t.outcome} by ${walletLabel(
        t.wallet,
        t.pseudonym,
      )} is ${z.toFixed(1)}σ above this market's typical trade (${fmtUsd(mean)})`,
      marketId: data.market.id,
      wallet: t.wallet,
      direction: (t.outcome === 'YES') === (t.side === 'BUY') ? 'YES' : 'NO',
      timestamp: t.timestamp,
    });
  }
  return signals;
}

/**
 * 3. One-sided flow burst: a cluster of same-direction notional inside a short
 * window that is large relative to the market's normal volume.
 */
export function detectFlowBursts(data: MarketData): Signal[] {
  const trades = [...data.trades].sort((a, b) => a.timestamp - b.timestamp);
  if (trades.length < 10) return [];
  const window = THRESHOLDS.flowBurstWindowSec;
  const volumeRef = Math.max(data.market.volume24h, 1);

  let best: { start: number; end: number; net: number; wallets: Set<string> } | null = null;
  let lo = 0;
  let netYes = 0;
  const walletsIn = new Map<string, number>();

  const signedUsd = (t: Trade) =>
    (t.outcome === 'YES') === (t.side === 'BUY') ? t.usdcSize : -t.usdcSize;

  for (let hi = 0; hi < trades.length; hi++) {
    netYes += signedUsd(trades[hi]);
    walletsIn.set(trades[hi].wallet, (walletsIn.get(trades[hi].wallet) ?? 0) + 1);
    while (trades[hi].timestamp - trades[lo].timestamp > window) {
      netYes -= signedUsd(trades[lo]);
      const c = (walletsIn.get(trades[lo].wallet) ?? 1) - 1;
      if (c <= 0) walletsIn.delete(trades[lo].wallet);
      else walletsIn.set(trades[lo].wallet, c);
      lo++;
    }
    const magnitude = Math.abs(netYes);
    if (
      magnitude >= THRESHOLDS.flowBurstMinUsd &&
      magnitude / volumeRef >= THRESHOLDS.flowBurstMinVolumeFraction &&
      (!best || magnitude > Math.abs(best.net))
    ) {
      best = {
        start: trades[lo].timestamp,
        end: trades[hi].timestamp,
        net: netYes,
        wallets: new Set(walletsIn.keys()),
      };
    }
  }
  if (!best) return [];

  const direction: 'YES' | 'NO' = best.net >= 0 ? 'YES' : 'NO';
  const fraction = Math.abs(best.net) / volumeRef;
  const score = clamp01(0.35 + fraction * 2);
  const minutes = Math.max(1, Math.round((best.end - best.start) / 60));
  return [
    {
      kind: 'flow-burst',
      score,
      evidence: `${fmtUsd(Math.abs(best.net))} of net ${direction} buying from ${
        best.wallets.size
      } wallet${best.wallets.size === 1 ? '' : 's'} within ${minutes} min (${(
        fraction * 100
      ).toFixed(0)}% of 24h volume)`,
      marketId: data.market.id,
      direction,
      timestamp: best.end,
    },
  ];
}

/**
 * 4. Price spike: abrupt repricing without gradual buildup, measured on the
 * YES price series.
 */
export function detectPriceSpikes(data: MarketData): Signal[] {
  const pts = data.priceHistory;
  if (pts.length < 12) return [];
  const window = THRESHOLDS.priceSpikeWindowSec;

  let best: { from: number; to: number; move: number; ts: number } | null = null;
  let lo = 0;
  for (let hi = 1; hi < pts.length; hi++) {
    while (pts[hi].t - pts[lo].t > window) lo++;
    const move = pts[hi].p - pts[lo].p;
    if (Math.abs(move) >= THRESHOLDS.priceSpikeMinMove && (!best || Math.abs(move) > Math.abs(best.move))) {
      best = { from: pts[lo].p, to: pts[hi].p, move, ts: pts[hi].t };
    }
  }
  if (!best) return [];

  // Compare against the series' typical step volatility: a big move in a
  // quiet market scores higher than one in an already-choppy market.
  const steps = pts.slice(1).map((p, i) => Math.abs(p.p - pts[i].p));
  const typicalStep = steps.reduce((a, b) => a + b, 0) / steps.length || 0.001;
  const abnormality = clamp01(Math.abs(best.move) / (typicalStep * 20));
  const score = clamp01(0.3 + 0.7 * abnormality);
  const direction: 'YES' | 'NO' = best.move > 0 ? 'YES' : 'NO';
  return [
    {
      kind: 'price-spike',
      score,
      evidence: `YES price moved ${(best.from * 100).toFixed(0)}¢ → ${(best.to * 100).toFixed(
        0,
      )}¢ (${best.move > 0 ? '+' : ''}${(best.move * 100).toFixed(0)}pts) within ${
        window / 3600
      }h against low prior volatility`,
      marketId: data.market.id,
      direction,
      timestamp: best.ts,
    },
  ];
}

/**
 * 5. Smart-money entry: a wallet with a strong resolved-market track record
 * opens a sizeable new position. Less "insider", more "informed" — this is
 * the primary driver of follow-the-money recommendations.
 */
export function detectSmartMoney(data: MarketData): Signal[] {
  const signals: Signal[] = [];
  const positions = walletNetPositions(data.trades);
  for (const [wallet, pos] of positions) {
    const profile = data.walletProfiles[wallet];
    if (!profile) continue;
    const resolved = profile.resolvedWins + profile.resolvedLosses;
    if (resolved < THRESHOLDS.smartMoneyMinResolved) continue;
    const winRate = profile.resolvedWins / resolved;
    if (winRate < THRESHOLDS.smartMoneyMinWinRate) continue;
    if (pos.totalUsd < THRESHOLDS.smartMoneyMinUsd) continue;

    const score = clamp01(
      (winRate - THRESHOLDS.smartMoneyMinWinRate) / (1 - THRESHOLDS.smartMoneyMinWinRate),
    ) * 0.5 + clamp01(pos.totalUsd / 50_000) * 0.5;
    signals.push({
      kind: 'smart-money',
      score,
      evidence: `${walletLabel(wallet, profile.pseudonym)} has won ${(winRate * 100).toFixed(
        0,
      )}% of ${resolved} resolved markets and just built ${fmtUsd(pos.totalUsd)} of ${pos.direction}`,
      marketId: data.market.id,
      wallet,
      direction: pos.direction,
      timestamp: pos.lastTs,
    });
  }
  return signals;
}

export function runDetectors(data: MarketData, now = Date.now() / 1000): Signal[] {
  return [
    ...detectFreshWallets(data, now),
    ...detectSizeOutliers(data),
    ...detectFlowBursts(data),
    ...detectPriceSpikes(data),
    ...detectSmartMoney(data),
  ];
}
