from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import random
import datetime

app = FastAPI(title="Alpha Factory (Mock)")

class AlphaSignal(BaseModel):
    timestamp: str
    strategy: str
    asset: str
    signal: float
    confidence: float
    features: dict

@app.get("/health")
def health():
    return {"status": "ok", "timestamp": datetime.datetime.utcnow().isoformat()}

@app.get("/signals", response_model=List[AlphaSignal])
def get_signals():
    strategies = ["mean_reversion", "momentum", "carry_trade", "stat_arb"]
    assets = ["BTC", "ETH", "SOL", "AVAX"]
    now = datetime.datetime.utcnow().isoformat()
    signals = []
    for strat in strategies:
        for asset in assets:
            signals.append(AlphaSignal(
                timestamp=now,
                strategy=strat,
                asset=asset,
                signal=round(random.uniform(-1, 1), 4),
                confidence=round(random.uniform(0.5, 1.0), 3),
                features={
                    "volatility": round(random.uniform(0.01, 0.1), 3),
                    "momentum": round(random.uniform(-2, 2), 2),
                    "skew": round(random.uniform(-1, 1), 2)
                }
            ))
    return signals
