"""
Regime Service — FastAPI microservice.
Exposes: GET /health · GET /regime/{symbol}

Security: X-Regime-Key header must match REGIME_API_KEY env var.
Symbol allowlist: ^NSEI, ^GSPC, ^IXIC, BTC-USD
"""

import os
from fastapi import FastAPI, HTTPException, Header
from fastapi.responses import JSONResponse
from regime import fit_and_classify, RegimeResult

app = FastAPI(title="TradeGuard Regime Service", version="1.0.0")

ALLOWED_SYMBOLS = {"^NSEI", "^GSPC", "^IXIC", "BTC-USD"}
REGIME_API_KEY  = os.getenv("REGIME_API_KEY", "")


def _auth(x_regime_key: str | None) -> None:
    if REGIME_API_KEY and x_regime_key != REGIME_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")


@app.get("/health")
def health():
    return {"status": "ok", "service": "regime"}


@app.get("/regime/{symbol}")
def get_regime(
    symbol: str,
    x_regime_key: str | None = Header(default=None),
) -> JSONResponse:
    _auth(x_regime_key)

    if symbol not in ALLOWED_SYMBOLS:
        raise HTTPException(status_code=400, detail=f"Symbol '{symbol}' not in allowlist: {sorted(ALLOWED_SYMBOLS)}")

    try:
        result: RegimeResult = fit_and_classify(symbol)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Regime computation failed: {str(e)}")

    return JSONResponse({
        "symbol":                  result.symbol,
        "current_regime":          result.current_regime,
        "confidence":              round(result.confidence, 4),
        "posterior":               result.posterior,
        "transition_from_current": result.transition_from_current,
        "regime_history_30d":      result.regime_history_30d,
        "model_meta":              result.model_meta,
    })
