# ORACLE FEEDS CATALOG

## Vox Populi Feeds (mock)

| id | name | category | unit | ttl_ms | sources | tags |
|----|------|----------|------|--------|---------|------|
| vox/x/sentiment_weighted:BTC | BTC X Sentiment | vox | score | 60000 | mock-x | vox, mock |
| vox/x/volume:BTC | BTC X Volume | vox | count/min | 60000 | mock-x | vox, mock |
| vox/x/velocity:BTC | BTC X Velocity | vox | zscore | 60000 | mock-x | vox, mock |
| vox/reddit/sentiment_weighted:BTC | BTC Reddit Sentiment | vox | score | 120000 | mock-reddit | vox, mock |
| vox/all/vpi:BTC | BTC Vox Populi Index | vox | score | 60000 | mock-x, mock-reddit | vox, mock |

## Ejemplo de señal mock

```
{
  "feedId": "vox/x/sentiment_weighted:BTC",
  "ts": "2025-10-20T00:00:00Z",
  "value": 0.25,
  "unit": "score",
  "confidence": 0.7,
  "quorum_ok": true,
  "stale": false,
  "evidence": [{"source_id": "mock-x", "captured_at": "2025-10-20T00:00:00Z"}],
  "tags": ["vox", "mock"]
}
```
