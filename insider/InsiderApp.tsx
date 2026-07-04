import React, { useEffect, useMemo, useState } from 'react';
import { FlaskConical, Loader2, Radar } from 'lucide-react';
import { loadData, LoadedData } from './services/dataSource';
import { analyzeMarkets } from './engine/scoring';
import { RecommendationCard, WalletAlertCard } from './components/cards';
import MarketsTable, { MarketRow } from './components/MarketsTable';

type Tab = 'recommendations' | 'alerts' | 'markets';

const REFRESH_MS = 60_000;

const TABS: { id: Tab; label: string }[] = [
  { id: 'recommendations', label: 'Recommendations' },
  { id: 'alerts', label: 'Suspicious activity' },
  { id: 'markets', label: 'Markets' },
];

const InsiderApp: React.FC = () => {
  const [loaded, setLoaded] = useState<LoadedData | null>(null);
  const [tab, setTab] = useState<Tab>('recommendations');

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setInterval> | undefined;
    loadData().then((d) => {
      if (!active) return;
      setLoaded(d);
      // Demo data is static; only poll when live data is flowing.
      if (!d.isDemo) {
        timer = setInterval(async () => {
          const next = await loadData();
          if (active && !next.isDemo) setLoaded(next);
        }, REFRESH_MS);
      }
    });
    return () => {
      active = false;
      if (timer) clearInterval(timer);
    };
  }, []);

  const result = useMemo(
    () => (loaded ? analyzeMarkets(loaded.datasets) : null),
    [loaded],
  );

  const marketRows: MarketRow[] = useMemo(() => {
    if (!loaded || !result) return [];
    return loaded.datasets
      .map((data) => {
        const alertScores = result.alerts
          .filter((a) => a.marketId === data.market.id)
          .map((a) => a.score);
        const rec = result.recommendations.find((r) => r.market.id === data.market.id);
        const score = Math.max(0, ...alertScores, rec?.confidence ?? 0);
        const signalCount =
          result.alerts
            .filter((a) => a.marketId === data.market.id)
            .reduce((n, a) => n + a.signals.length, 0) + (rec?.signals.length ?? 0);
        return { data, score, signalCount };
      })
      .sort((a, b) => b.score - a.score);
  }, [loaded, result]);

  return (
    <div className="min-h-screen bg-[#0d0d0d] font-sans text-white">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <header className="mb-6">
          <div className="flex items-center gap-3">
            <Radar className="h-7 w-7 text-[#3987e5]" aria-hidden />
            <h1 className="text-2xl font-semibold">Insider Radar</h1>
            <span className="rounded-full border border-white/15 px-2 py-0.5 text-xs text-[#c3c2b7]">
              Polymarket
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-[#898781]">
            Scans the highest-volume markets for trading patterns consistent with informed or
            insider activity — fresh wallets making outsized bets, one-sided flow bursts, abrupt
            repricing, and proven winners building new positions.
          </p>
        </header>

        {loaded?.isDemo && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#fab219]/40 bg-[#fab219]/10 px-4 py-3 text-sm text-[#fab219]">
            <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              <strong className="font-semibold">Demo mode.</strong> Live Polymarket data is
              unreachable from this network, so this is a built-in demo dataset with planted
              insider patterns. Run the app with internet access to scan real markets.
            </span>
          </div>
        )}

        <nav className="mb-6 flex gap-1 rounded-xl border border-white/10 bg-[#1a1a19] p-1" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                tab === t.id ? 'bg-white/10 text-white' : 'text-[#898781] hover:text-[#c3c2b7]'
              }`}
            >
              {t.label}
              {result && (
                <span className="ml-1.5 tabular-nums text-xs text-[#898781]">
                  {t.id === 'recommendations'
                    ? result.recommendations.length
                    : t.id === 'alerts'
                      ? result.alerts.length
                      : loaded?.datasets.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {!result ? (
          <div className="flex items-center justify-center gap-2 py-24 text-[#898781]">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            Scanning markets…
          </div>
        ) : (
          <main className="space-y-4">
            {tab === 'recommendations' &&
              (result.recommendations.length === 0 ? (
                <p className="py-16 text-center text-sm text-[#898781]">
                  No anomalous flow strong enough to act on right now.
                </p>
              ) : (
                result.recommendations.map((rec) => (
                  <RecommendationCard key={rec.market.id} rec={rec} />
                ))
              ))}
            {tab === 'alerts' &&
              (result.alerts.length === 0 ? (
                <p className="py-16 text-center text-sm text-[#898781]">
                  No suspicious wallet activity detected in the scanned window.
                </p>
              ) : (
                result.alerts.map((a) => (
                  <WalletAlertCard key={`${a.wallet}-${a.marketId}`} alert={a} />
                ))
              ))}
            {tab === 'markets' && <MarketsTable rows={marketRows} />}
          </main>
        )}

        <footer className="mt-10 border-t border-white/10 pt-4 text-xs leading-relaxed text-[#898781]">
          Anomaly scores flag behavior <em>statistically consistent</em> with informed trading;
          they are not proof of insider trading, and nothing here is financial advice. Data:
          Polymarket public APIs.
        </footer>
      </div>
    </div>
  );
};

export default InsiderApp;
