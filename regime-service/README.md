# TradeGuard Regime Service

Python FastAPI microservice that classifies market regime using a 4-state Gaussian HMM.

**Regimes:** `BULL_TREND` | `BEAR_TREND` | `CHOP` | `CRISIS`

## API

```
GET /health                          → { status: "ok" }
GET /regime/{symbol}                 → RegimeResult JSON
  Headers: X-Regime-Key: <REGIME_API_KEY>
  Allowed symbols: ^NSEI, ^GSPC, ^IXIC, BTC-USD
```

## Local Development

```bash
pip install -r requirements.txt
REGIME_API_KEY=dev uvicorn main:app --reload --port 8000

# Test
curl -H "X-Regime-Key: dev" http://localhost:8000/regime/%5ENSEI
```

## Deploy to Render (Free Tier)

1. Push this directory (or the full repo) to GitHub
2. New Web Service → select repo
3. Runtime: **Docker**
4. Dockerfile path: `regime-service/Dockerfile`
5. Environment Variables:
   - `REGIME_API_KEY` — any strong random string
   - `PORT` — `8000` (auto-set by Render)
6. After deploy, copy the service URL to Vercel env:
   - `REGIME_SERVICE_URL=https://your-app.onrender.com`
   - `REGIME_API_KEY=<same value>`

> **Note:** Render free tier sleeps after 15 min of inactivity. The Next.js regime service (T16) handles this with a 15-second timeout and heuristic fallback — the app never crashes if the service is cold.

## Response Schema

```json
{
  "symbol": "^NSEI",
  "current_regime": "CHOP",
  "confidence": 0.74,
  "posterior": {
    "BULL_TREND": 0.12,
    "BEAR_TREND": 0.09,
    "CHOP": 0.74,
    "CRISIS": 0.05
  },
  "transition_from_current": {
    "BULL_TREND": 0.18,
    "BEAR_TREND": 0.07,
    "CHOP": 0.71,
    "CRISIS": 0.04
  },
  "regime_history_30d": [
    { "date": "2026-05-19", "regime": "BULL_TREND" },
    ...
  ],
  "model_meta": {
    "n_obs": 1198,
    "converged": true,
    "fitted_at": "2026-06-17T06:45:00"
  }
}
```

## Label Mapping Logic

HMM states are unordered — assignment is based on per-state statistics:
- State with **highest mean log_return** → `BULL_TREND`
- State with **lowest mean log_return + highest vol_20d** → `CRISIS`
- Remaining state with **negative mean log_return** → `BEAR_TREND`
- Remaining state → `CHOP`
