// Deterministic demo dataset used when the live Polymarket APIs are
// unreachable (offline dev, restricted networks). It plants several
// insider-style patterns so every detector demonstrably fires:
//
//   M1  "CEO resignation"  — fresh wallet whale + size outlier + flow burst + price spike
//   M2  "Title fight"      — smart-money wallet building a large NO position
//   M3  "Studio album"     — coordinated flow burst from several wallets + price spike
//   the rest              — organic, should score low / produce no alerts
//
// Generation is seeded, so scores and feeds are stable across reloads.

import { Market, MarketData, PricePoint, Trade, WalletProfile } from '../types';

// mulberry32 — tiny seeded PRNG, good enough for demo data
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const HOUR = 3600;
const DAY = 86_400;

const hex = (r: () => number, n: number) =>
  Array.from({ length: n }, () => '0123456789abcdef'[Math.floor(r() * 16)]).join('');

interface MarketSpec {
  question: string;
  category: string;
  yesPrice: number;
  volume24h: number;
  liquidity: number;
  endInDays: number;
  plant?: 'insider-whale' | 'smart-money' | 'coordinated-burst';
}

const SPECS: MarketSpec[] = [
  { question: 'Will the CEO of Vantera Corp resign before August 1?', category: 'Business', yesPrice: 0.61, volume24h: 310_000, liquidity: 95_000, endInDays: 4, plant: 'insider-whale' },
  { question: 'Will Reyes win the heavyweight title fight on July 12?', category: 'Sports', yesPrice: 0.44, volume24h: 520_000, liquidity: 140_000, endInDays: 8, plant: 'smart-money' },
  { question: 'Will Nova Rae announce a surprise album by July 31?', category: 'Entertainment', yesPrice: 0.58, volume24h: 180_000, liquidity: 60_000, endInDays: 27, plant: 'coordinated-burst' },
  { question: 'Will the Fed cut rates at the July FOMC meeting?', category: 'Economics', yesPrice: 0.31, volume24h: 890_000, liquidity: 420_000, endInDays: 26 },
  { question: 'Will Bitcoin close above $130k on July 31?', category: 'Crypto', yesPrice: 0.47, volume24h: 640_000, liquidity: 310_000, endInDays: 27 },
  { question: 'Will the incumbent win the Buenos Aires mayoral runoff?', category: 'Politics', yesPrice: 0.55, volume24h: 260_000, liquidity: 120_000, endInDays: 10 },
  { question: 'Will July 2026 be the hottest July on record globally?', category: 'Science', yesPrice: 0.72, volume24h: 95_000, liquidity: 45_000, endInDays: 40 },
  { question: 'Will the Marlins make the 2026 MLB playoffs?', category: 'Sports', yesPrice: 0.18, volume24h: 140_000, liquidity: 70_000, endInDays: 90 },
  { question: 'Will SpaceX complete a crewed Starship flight in 2026?', category: 'Science', yesPrice: 0.39, volume24h: 210_000, liquidity: 100_000, endInDays: 180 },
  { question: 'Will US CPI for June come in above 3.0% YoY?', category: 'Economics', yesPrice: 0.26, volume24h: 330_000, liquidity: 160_000, endInDays: 12 },
  { question: 'Will "Midnight Harbor" top the box office opening weekend?', category: 'Entertainment', yesPrice: 0.63, volume24h: 88_000, liquidity: 38_000, endInDays: 15 },
  { question: 'Will Ethereum ETF net inflows exceed $2B in July?', category: 'Crypto', yesPrice: 0.51, volume24h: 270_000, liquidity: 130_000, endInDays: 27 },
];

/** Organic random-walk price series: 30-min points over the last 7 days. */
function makePriceHistory(r: () => number, now: number, endPrice: number, spike?: { at: number; from: number; to: number }): PricePoint[] {
  const points: PricePoint[] = [];
  const start = now - 7 * DAY;
  const n = Math.floor((7 * DAY) / (30 * 60));
  let p = spike ? spike.from : endPrice + (r() - 0.5) * 0.08;
  for (let i = 0; i <= n; i++) {
    const t = start + i * 30 * 60;
    if (spike && t >= spike.at && p < spike.to - 0.005 && spike.to > spike.from) {
      // jump happens across ~3 points (90 min)
      p = Math.min(spike.to, p + (spike.to - spike.from) / 3);
    } else if (spike && t < spike.at) {
      p += (r() - 0.5) * 0.006 + (spike.from - p) * 0.05; // quiet drift near "from"
    } else {
      p += (r() - 0.5) * 0.008 + (endPrice - p) * 0.02; // mean-revert to endPrice
    }
    p = Math.max(0.02, Math.min(0.98, p));
    points.push({ t, p: Number(p.toFixed(4)) });
  }
  return points;
}

function organicTrade(r: () => number, marketId: string, wallet: string, t: number, price: number, i: number): Trade {
  const size = 20 + Math.floor(r() * 600);
  const outcome = r() < 0.5 ? 'YES' : 'NO';
  return {
    id: `${marketId.slice(0, 10)}-t${i}`,
    marketId,
    wallet,
    side: r() < 0.85 ? 'BUY' : 'SELL',
    outcome,
    price: outcome === 'YES' ? price : 1 - price,
    size,
    usdcSize: Number((size * (outcome === 'YES' ? price : 1 - price)).toFixed(2)),
    timestamp: Math.floor(t),
  };
}

function organicProfile(r: () => number, address: string, now: number): WalletProfile {
  const resolved = Math.floor(r() * 30);
  return {
    address,
    firstSeen: now - (30 + r() * 700) * DAY,
    tradeCount: 20 + Math.floor(r() * 400),
    marketsTraded: 5 + Math.floor(r() * 60),
    resolvedWins: Math.floor(resolved * (0.35 + r() * 0.25)), // 35–60% win rate
    resolvedLosses: 0, // set below
  };
}

export function buildMockDatasets(now = Date.now() / 1000): MarketData[] {
  const r = rng(20260704);
  return SPECS.map((spec, mi) => {
    const marketId = `0x${hex(r, 40)}`;
    const market: Market = {
      id: marketId,
      question: spec.question,
      category: spec.category,
      endDate: new Date((now + spec.endInDays * DAY) * 1000).toISOString(),
      volume24h: spec.volume24h,
      liquidity: spec.liquidity,
      yesPrice: spec.yesPrice,
      clobTokenIds: [`tok-${mi}-yes`, `tok-${mi}-no`],
    };

    // ~25 organic wallets trading over the last 24h
    const wallets = Array.from({ length: 25 }, () => `0x${hex(r, 40)}`);
    const walletProfiles: Record<string, WalletProfile> = {};
    for (const w of wallets) {
      const p = organicProfile(r, w, now);
      const resolved = Math.max(4, Math.floor(r() * 30));
      p.resolvedLosses = Math.max(0, resolved - p.resolvedWins);
      walletProfiles[w] = p;
    }

    const trades: Trade[] = [];
    const tradeCount = 90 + Math.floor(r() * 80);
    for (let i = 0; i < tradeCount; i++) {
      const t = now - r() * DAY;
      const w = wallets[Math.floor(r() * wallets.length)];
      trades.push(organicTrade(r, marketId, w, t, spec.yesPrice + (r() - 0.5) * 0.04, i));
    }

    let spike: { at: number; from: number; to: number } | undefined;

    if (spec.plant === 'insider-whale') {
      // A 14-hour-old wallet with 3 lifetime trades buys $18.4k of YES in
      // three clips within 20 minutes, ~6h ago; price jumps 0.24 → 0.61.
      const whale = `0x${hex(r, 40)}`;
      walletProfiles[whale] = {
        address: whale,
        pseudonym: 'quiet-falcon',
        firstSeen: now - 14 * HOUR,
        tradeCount: 3,
        marketsTraded: 1,
        resolvedWins: 0,
        resolvedLosses: 0,
      };
      const burstStart = now - 6 * HOUR;
      [7400, 6200, 4800].forEach((usd, i) => {
        const price = 0.26 + i * 0.09;
        trades.push({
          id: `${marketId.slice(0, 10)}-whale${i}`,
          marketId,
          wallet: whale,
          pseudonym: 'quiet-falcon',
          side: 'BUY',
          outcome: 'YES',
          price,
          size: Number((usd / price).toFixed(2)),
          usdcSize: usd,
          timestamp: Math.floor(burstStart + i * 7 * 60),
        });
      });
      spike = { at: burstStart, from: 0.24, to: 0.61 };
    }

    if (spec.plant === 'smart-money') {
      // A wallet with an 82% win rate over 44 resolved markets builds $13k of NO.
      const shark = `0x${hex(r, 40)}`;
      walletProfiles[shark] = {
        address: shark,
        pseudonym: 'ledger-owl',
        firstSeen: now - 500 * DAY,
        tradeCount: 1240,
        marketsTraded: 210,
        resolvedWins: 36,
        resolvedLosses: 8,
      };
      [5200, 4300, 3500].forEach((usd, i) => {
        const price = 0.55 + i * 0.01;
        trades.push({
          id: `${marketId.slice(0, 10)}-shark${i}`,
          marketId,
          wallet: shark,
          pseudonym: 'ledger-owl',
          side: 'BUY',
          outcome: 'NO',
          price,
          size: Number((usd / price).toFixed(2)),
          usdcSize: usd,
          timestamp: Math.floor(now - 10 * HOUR + i * 3 * HOUR),
        });
      });
    }

    if (spec.plant === 'coordinated-burst') {
      // Five wallets buy $2.4k of YES each within 18 minutes, ~3h ago;
      // price runs 0.44 → 0.58. No single wallet is fresh or huge — the
      // burst itself is the anomaly.
      const burstStart = now - 3 * HOUR;
      for (let i = 0; i < 5; i++) {
        const w = `0x${hex(r, 40)}`;
        walletProfiles[w] = organicProfile(r, w, now);
        walletProfiles[w].resolvedLosses = 10;
        const price = 0.45 + i * 0.025;
        const usd = 2400;
        trades.push({
          id: `${marketId.slice(0, 10)}-burst${i}`,
          marketId,
          wallet: w,
          side: 'BUY',
          outcome: 'YES',
          price,
          size: Number((usd / price).toFixed(2)),
          usdcSize: usd,
          timestamp: Math.floor(burstStart + i * 4 * 60),
        });
      }
      spike = { at: burstStart, from: 0.44, to: 0.58 };
    }

    trades.sort((a, b) => a.timestamp - b.timestamp);
    return {
      market,
      trades,
      priceHistory: makePriceHistory(r, now, spec.yesPrice, spike),
      walletProfiles,
    };
  });
}
