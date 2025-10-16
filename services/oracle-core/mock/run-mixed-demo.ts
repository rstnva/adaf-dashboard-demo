#!/usr/bin/env ts-node
import process from 'node:process';

import { generateMockSamples } from './generator';
import { processPipeline } from '../pipeline';
import { loadFeeds } from '../registry/feeds';
import { resolveBaseline, getRpcHeartbeatTable } from '../monitoring/heartbeats';

async function main() {
  const feeds = await loadFeeds();
  const trackedFeeds = feeds.filter(feed => !!resolveBaseline(feed.id));
  const iterations = Number(process.env.ORACLE_MIXED_TICKS ?? 5);
  const seed = Number(process.env.ORACLE_DEMO_SEED ?? 101);

  console.info(`oracle-mixed-demo: feeds=${trackedFeeds.length} iterations=${iterations}`);

  for (let tick = 0; tick < iterations; tick += 1) {
    const entries = await generateMockSamples({
      seed: seed + tick,
      filter: feed => trackedFeeds.some(f => f.id === feed.id),
    });

    let processed = 0;
    for (const entry of entries) {
      const result = await processPipeline({ feed: entry.feed, samples: entry.samples });
      if (result) {
        processed += 1;
      }
    }

    console.info(`oracle-mixed-demo: tick=${tick + 1}/${iterations} processed=${processed}`);
  }

  const table = getRpcHeartbeatTable();
  console.table(
    table.map(entry => ({
      feed: entry.feed,
      rpc: entry.rpc,
      status: entry.status,
      latencyMs: entry.latencyMs,
      latencyScore: entry.latencyScore,
      age: `${Math.round((Date.now() - new Date(entry.lastHeartbeat).getTime()) / 1000)}s`,
    }))
  );

  console.info('oracle-mixed-demo: done');
}

main().catch(error => {
  console.error('oracle-mixed-demo failed', error);
  process.exit(1);
});
