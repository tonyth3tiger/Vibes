// Domain types for the Polymarket insider-activity detection engine.

export interface Market {
  /** Polymarket conditionId */
  id: string;
  question: string;
  category: string;
  /** ISO timestamp the market resolves/closes */
  endDate: string;
  volume24h: number;
  liquidity: number;
  /** Current YES price in [0, 1] */
  yesPrice: number;
  /** CLOB token ids for [YES, NO] outcomes (used for price history) */
  clobTokenIds: [string, string];
}

export interface Trade {
  id: string;
  marketId: string;
  wallet: string;
  pseudonym?: string;
  side: 'BUY' | 'SELL';
  outcome: 'YES' | 'NO';
  /** Execution price in [0, 1] */
  price: number;
  /** Shares */
  size: number;
  /** Notional in USDC */
  usdcSize: number;
  /** Epoch seconds */
  timestamp: number;
}

export interface WalletProfile {
  address: string;
  pseudonym?: string;
  /** Epoch seconds of the wallet's first on-platform activity */
  firstSeen: number;
  /** Lifetime trade count (including trades in the scanned window) */
  tradeCount: number;
  marketsTraded: number;
  /** Track record across resolved markets, when known */
  resolvedWins: number;
  resolvedLosses: number;
}

export interface PricePoint {
  /** Epoch seconds */
  t: number;
  /** YES price in [0, 1] */
  p: number;
}

export type SignalKind =
  | 'fresh-wallet'
  | 'size-outlier'
  | 'flow-burst'
  | 'price-spike'
  | 'smart-money';

export interface Signal {
  kind: SignalKind;
  /** Strength in [0, 1] */
  score: number;
  /** Human-readable evidence for the card UI */
  evidence: string;
  marketId: string;
  /** Wallet-attributable signals set this; market-level ones (price-spike) do not */
  wallet?: string;
  /** Outcome the anomalous flow favors, when directional */
  direction?: 'YES' | 'NO';
  /** Epoch seconds the anomaly occurred */
  timestamp: number;
}

/** Everything the engine needs about one market */
export interface MarketData {
  market: Market;
  trades: Trade[];
  priceHistory: PricePoint[];
  walletProfiles: Record<string, WalletProfile>;
}

export interface WalletAlert {
  wallet: string;
  pseudonym?: string;
  marketId: string;
  marketQuestion: string;
  direction: 'YES' | 'NO';
  totalUsd: number;
  signals: Signal[];
  /** Composite suspicion score in [0, 1] */
  score: number;
}

export interface MarketRecommendation {
  market: Market;
  direction: 'YES' | 'NO';
  /** Composite confidence in [0, 1] */
  confidence: number;
  rationale: string[];
  signals: Signal[];
  priceHistory: PricePoint[];
}

export interface EngineResult {
  alerts: WalletAlert[];
  recommendations: MarketRecommendation[];
  /** Epoch seconds */
  generatedAt: number;
}
