"""
Regime classification using Gaussian HMM (4 components).

REGIMES: BULL_TREND | BEAR_TREND | CHOP | CRISIS

Label mapping rule (applied after fitting — states are unordered):
  - Highest mean log_return        → BULL_TREND
  - Lowest mean log_return AND highest mean vol_20d → CRISIS
  - Remaining state with negative mean log_return   → BEAR_TREND
  - Remaining state                                  → CHOP
"""

import numpy as np
import pandas as pd
import yfinance as yf
from datetime import datetime, timedelta
from hmmlearn.hmm import GaussianHMM
from dataclasses import dataclass, field
from typing import Any

REGIME_LABELS = ["BULL_TREND", "BEAR_TREND", "CHOP", "CRISIS"]

@dataclass
class RegimeResult:
    symbol: str
    current_regime: str
    confidence: float
    posterior: dict[str, float]
    transition_from_current: dict[str, float]
    regime_history_30d: list[dict[str, str]]
    model_meta: dict[str, Any]


_cache: dict[str, tuple[datetime, RegimeResult]] = {}
_CACHE_TTL_HOURS = 24


def fetch_features(symbol: str, days: int = 1260) -> pd.DataFrame:
    """Fetch OHLCV and derive HMM feature columns, dropping NaN rows."""
    end = datetime.today()
    start = end - timedelta(days=days + 60)  # buffer for rolling windows
    ticker = yf.Ticker(symbol)
    df = ticker.history(start=start.strftime("%Y-%m-%d"), end=end.strftime("%Y-%m-%d"), interval="1d")

    if df.empty or len(df) < 30:
        raise ValueError(f"Insufficient data for {symbol}")

    df = df.sort_index()
    df["log_return"] = np.log(df["Close"] / df["Close"].shift(1))
    df["range_pct"]  = (df["High"] - df["Low"]) / df["Close"].shift(1)
    df["vol_5d"]     = df["log_return"].rolling(5).std()
    df["vol_20d"]    = df["log_return"].rolling(20).std()

    df = df.dropna(subset=["log_return", "range_pct", "vol_5d", "vol_20d"])
    return df[["log_return", "range_pct", "vol_5d", "vol_20d"]].tail(days)


def _assign_labels(model: GaussianHMM) -> dict[int, str]:
    """Map HMM state indices to regime labels based on per-state statistics."""
    means = model.means_  # shape (n_components, n_features)
    # Feature indices: 0=log_return, 1=range_pct, 2=vol_5d, 3=vol_20d
    mean_returns = means[:, 0]
    mean_vol20   = means[:, 3]

    states = list(range(len(mean_returns)))
    labels: dict[int, str] = {}

    bull = int(np.argmax(mean_returns))
    labels[bull] = "BULL_TREND"

    remaining = [s for s in states if s != bull]
    # Crisis: lowest return AND highest vol among remaining
    neg_returns  = [mean_returns[s] for s in remaining]
    vol20_remain = [mean_vol20[s] for s in remaining]
    # Combined score: low return + high vol
    crisis_scores = [-mean_returns[s] + mean_vol20[s] for s in remaining]
    crisis = remaining[int(np.argmax(crisis_scores))]
    labels[crisis] = "CRISIS"

    remaining2 = [s for s in remaining if s != crisis]
    # Bear: most negative remaining return
    bear = remaining2[int(np.argmin([mean_returns[s] for s in remaining2]))] if len(remaining2) > 1 else remaining2[0]
    labels[bear] = "BEAR_TREND"

    for s in remaining2:
        if s not in labels:
            labels[s] = "CHOP"

    return labels


def fit_and_classify(symbol: str) -> RegimeResult:
    now = datetime.utcnow()

    # Check cache
    if symbol in _cache:
        cached_at, result = _cache[symbol]
        age_h = (now - cached_at).total_seconds() / 3600
        if age_h < _CACHE_TTL_HOURS:
            return result

    df = fetch_features(symbol)
    X = df.values.astype(float)

    model = GaussianHMM(
        n_components=4,
        covariance_type="full",
        n_iter=200,
        random_state=42,
    )
    model.fit(X)

    label_map = _assign_labels(model)

    # Decode full sequence
    hidden_states = model.predict(X)
    # Posterior probabilities for latest bar
    posteriors_raw = model.predict_proba(X)
    last_posterior = posteriors_raw[-1]

    current_state = int(hidden_states[-1])
    current_regime = label_map[current_state]
    confidence = float(last_posterior[current_state])

    # Build posterior dict by regime name
    posterior: dict[str, float] = {}
    for state_idx, prob in enumerate(last_posterior):
        regime_name = label_map[state_idx]
        posterior[regime_name] = round(float(prob), 4)

    # Transition probabilities from current state
    trans_matrix = model.transmat_
    transition: dict[str, float] = {}
    for state_idx in range(4):
        regime_name = label_map[state_idx]
        transition[regime_name] = round(float(trans_matrix[current_state][state_idx]), 4)

    # 30-day regime history
    dates = df.index[-30:]
    hist_states = hidden_states[-30:]
    history = [
        {
            "date": str(dates[i].date()),
            "regime": label_map[int(hist_states[i])],
        }
        for i in range(len(dates))
    ]

    meta = {
        "n_obs": len(X),
        "converged": bool(model.monitor_.converged),
        "fitted_at": now.isoformat(),
    }

    result = RegimeResult(
        symbol=symbol,
        current_regime=current_regime,
        confidence=confidence,
        posterior=posterior,
        transition_from_current=transition,
        regime_history_30d=history,
        model_meta=meta,
    )
    _cache[symbol] = (now, result)
    return result
