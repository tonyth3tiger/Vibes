// Data orchestrator: load live Polymarket data, or fall back to the
// deterministic demo dataset when the APIs are unreachable.

import { MarketData, WalletProfile } from '../types';
import { buildMockDatasets } from './mockData';
import {
  fetchPriceHistory,
  fetchTopMarkets,
  fetchTrades,
  fetchWalletProfile,
} from './polymarketApi';

export interface LoadedData {
  datasets: MarketData[];
  /** True when showing the built-in demo dataset instead of live data */
  isDemo: boolean;
}

const MARKET_COUNT = 12;
/** Only profile the biggest wallets per market — one API call each. */
const PROFILED_WALLETS_PER_MARKET = 8;

async function loadLive(): Promise<MarketData[]> {
  const markets = await fetchTopMarkets(MARKET_COUNT);
  if (markets.length === 0) throw new Error('no active markets returned');

  const datasets = await Promise.all(
    markets.map(async (market): Promise<MarketData> => {
      const [trades, priceHistory] = await Promise.all([
        fetchTrades(market.id),
        fetchPriceHistory(market.clobTokenIds[0]).catch(() => []),
      ]);

      // Profile the wallets with the largest notional in this market.
      const usdByWallet = new Map<string, number>();
      for (const t of trades) {
        usdByWallet.set(t.wallet, (usdByWallet.get(t.wallet) ?? 0) + t.usdcSize);
      }
      const topWallets = [...usdByWallet.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, PROFILED_WALLETS_PER_MARKET)
        .map(([w]) => w);

      const profiles = await Promise.allSettled(topWallets.map(fetchWalletProfile));
      const walletProfiles: Record<string, WalletProfile> = {};
      profiles.forEach((res, i) => {
        if (res.status === 'fulfilled') walletProfiles[topWallets[i]] = res.value;
      });

      return { market, trades, priceHistory, walletProfiles };
    }),
  );
  return datasets;
}

export async function loadData(): Promise<LoadedData> {
  try {
    return { datasets: await loadLive(), isDemo: false };
  } catch (e) {
    console.warn('Live Polymarket data unavailable, using demo dataset:', e);
    return { datasets: buildMockDatasets(), isDemo: true };
  }
}
