# Vibes

Two apps share this Vite + React project:

| App | Route | What it does |
|---|---|---|
| Travel Summary Generator | `/` | Turns a trip spreadsheet into an illustrated booklet (needs `GEMINI_API_KEY`) |
| **Insider Radar** | `/#/insider` | Scans Polymarket's highest-volume markets for trading patterns consistent with informed/insider activity and turns them into ranked recommendations |

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. (Travel app only) Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

Then open http://localhost:3000 (travel app) or http://localhost:3000/#/insider (Insider Radar).

## Insider Radar

The dashboard pulls live public data from Polymarket (no API key needed) — the
Gamma API for markets, the Data API for trades and wallet histories, and the
CLOB API for price series — and runs five anomaly detectors over it:

1. **Fresh-wallet large bet** — a brand-new wallet with no history takes a big
   one-sided position, especially close to resolution (the signature pattern of
   real Polymarket insider cases).
2. **Size outlier** — trades far outside the market's typical size distribution.
3. **One-sided flow burst** — a cluster of same-direction notional in a short
   window, large relative to normal volume.
4. **Price spike** — abrupt repricing without gradual buildup.
5. **Smart money** — a wallet with a strong resolved-market track record opening
   a sizeable new position.

Signals combine (noisy-OR with per-signal weights) into a per-wallet suspicion
score (the **Suspicious activity** feed) and a per-market confidence with a
lean direction (the **Recommendations** feed). The **Markets** tab is the raw
table of everything scanned.

**Demo mode:** if the Polymarket APIs are unreachable (offline, restricted
network), the app automatically falls back to a built-in deterministic demo
dataset with planted insider patterns and shows a banner saying so.

**Disclaimer:** anomaly scores flag behavior *statistically consistent* with
informed trading. They are not proof of insider trading, and nothing in this
app is financial advice.
