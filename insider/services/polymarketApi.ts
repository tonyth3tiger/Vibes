// Thin clients for Polymarket's three public read APIs (no key required).
//
// In dev we go through the Vite proxy (see vite.config.ts) to sidestep CORS;
// production builds hit the hosts directly.

import { Market, PricePoint, Trade, WalletProfile } from '../types';

const DEV = import.meta.env.DEV;
const GAMMA = DEV ? '/api/gamma' : 'https://gamma-api.polymarket.com';
const DATA = DEV ? '/api/data' : 'https://data-api.polymarket.com';
const CLOB = DEV ? '/api/clob' : 'https://clob.polymarket.com';

export class PolymarketApiError extends Error {
  constructor(message: string, readonly endpoint: string) {
    super(message);
    this.name = 'PolymarketApiError';
  }
}

async function getJson<T>(url: string, timeoutMs = 10_000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new PolymarketApiError(`HTTP ${res.status}`, url);
    return (await res.json()) as T;
  } catch (e) {
    if (e instanceof PolymarketApiError) throw e;
    throw new PolymarketApiError(e instanceof Error ? e.message : String(e), url);
  } finally {
    clearTimeout(timer);
  }
}

const parseJsonArray = (raw: unknown): string[] => {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string') {
    try {
      const v = JSON.parse(raw);
      return Array.isArray(v) ? v.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
};

/** Active markets ranked by 24h volume (Gamma API). */
export async function fetchTopMarkets(limit = 12): Promise<Market[]> {
  type GammaMarket = {
    conditionId: string;
    question: string;
    category?: string;
    endDate?: string;
    endDateIso?: string;
    volume24hr?: number | string;
    liquidityNum?: number | string;
    liquidity?: number | string;
    outcomePrices?: string | string[];
    clobTokenIds?: string | string[];
  };
  const rows = await getJson<GammaMarket[]>(
    `${GAMMA}/markets?closed=false&active=true&order=volume24hr&ascending=false&limit=${limit}`,
  );
  return rows
    .map((m): Market | null => {
      const tokens = parseJsonArray(m.clobTokenIds);
      const prices = parseJsonArray(m.outcomePrices).map(Number);
      if (!m.conditionId || tokens.length < 2) return null;
      return {
        id: m.conditionId,
        question: m.question,
        category: m.category || 'Other',
        endDate: m.endDate || m.endDateIso || new Date(Date.now() + 30 * 86_400_000).toISOString(),
        volume24h: Number(m.volume24hr ?? 0),
        liquidity: Number(m.liquidityNum ?? m.liquidity ?? 0),
        yesPrice: Number.isFinite(prices[0]) ? prices[0] : 0.5,
        clobTokenIds: [tokens[0], tokens[1]],
      };
    })
    .filter((m): m is Market => m !== null);
}

/** Recent trades for one market (Data API). */
export async function fetchTrades(conditionId: string, limit = 500): Promise<Trade[]> {
  type DataTrade = {
    transactionHash?: string;
    proxyWallet: string;
    pseudonym?: string;
    side: string;
    outcome: string;
    price: number | string;
    size: number | string;
    timestamp: number | string;
  };
  const rows = await getJson<DataTrade[]>(
    `${DATA}/trades?market=${conditionId}&limit=${limit}&takerOnly=true`,
  );
  return rows.map((t, i) => {
    const price = Number(t.price);
    const size = Number(t.size);
    return {
      id: t.transactionHash ?? `${conditionId}-${i}`,
      marketId: conditionId,
      wallet: t.proxyWallet,
      pseudonym: t.pseudonym || undefined,
      side: t.side?.toUpperCase() === 'SELL' ? 'SELL' : 'BUY',
      outcome: t.outcome?.toUpperCase() === 'NO' ? 'NO' : 'YES',
      price,
      size,
      usdcSize: price * size,
      timestamp: Number(t.timestamp),
    };
  });
}

/** YES-token price history (CLOB API). */
export async function fetchPriceHistory(yesTokenId: string): Promise<PricePoint[]> {
  const res = await getJson<{ history: { t: number; p: number }[] }>(
    `${CLOB}/prices-history?market=${yesTokenId}&interval=1w&fidelity=30`,
  );
  return (res.history ?? []).map((h) => ({ t: h.t, p: h.p }));
}

/**
 * Wallet profile from its activity history (Data API). One request per wallet,
 * so callers should only profile the wallets that matter (biggest positions).
 */
export async function fetchWalletProfile(wallet: string): Promise<WalletProfile> {
  type ActivityRow = {
    timestamp: number | string;
    conditionId?: string;
    type?: string;
    pseudonym?: string;
  };
  const rows = await getJson<ActivityRow[]>(
    `${DATA}/activity?user=${wallet}&limit=500&sortDirection=ASC`,
  );
  const trades = rows.filter((r) => (r.type ?? 'TRADE').toUpperCase() === 'TRADE');
  const markets = new Set(trades.map((r) => r.conditionId).filter(Boolean));
  return {
    address: wallet,
    pseudonym: rows.find((r) => r.pseudonym)?.pseudonym || undefined,
    firstSeen: rows.length ? Number(rows[0].timestamp) : Date.now() / 1000,
    tradeCount: trades.length,
    marketsTraded: markets.size,
    // The public activity feed doesn't expose resolved P&L directly; live mode
    // leaves the track record unknown (smart-money detector then stays quiet).
    resolvedWins: 0,
    resolvedLosses: 0,
  };
}
