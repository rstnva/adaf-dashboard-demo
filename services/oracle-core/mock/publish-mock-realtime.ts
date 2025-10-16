#!/usr/bin/env ts-node
import process from 'node:process';

import { generateMockSamples } from './generator';
import { processPipeline } from '../pipeline';
import type { Feed } from '../registry/schema';

interface CliOptions {
  feeds: string[];
  seed: number;
  interval: number;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    feeds: (process.env.ORACLE_MOCK_FEEDS ?? 'wsp/*,news/*').split(','),
    seed: Number(process.env.ORACLE_DEMO_SEED ?? 42),
    interval: Number(process.env.ORACLE_DEMO_INTERVAL_MS ?? 4000),
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--feeds' && args[i + 1]) {
      options.feeds = args[i + 1].split(',');
      i += 1;
    } else if (arg === '--seed' && args[i + 1]) {
      options.seed = Number(args[i + 1]);
      i += 1;
    } else if (arg === '--interval' && args[i + 1]) {
      options.interval = Number(args[i + 1]);
      i += 1;
    }
  }

  return options;
}

function globToRegex(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  const regex = '^' + escaped.replace(/\*/g, '.*') + '$';
  return new RegExp(regex);
}

function buildFilter(patterns: string[]) {
  const regexes = patterns.map(globToRegex);
  return (feed: Feed) => regexes.some(regex => regex.test(feed.id));
}

async function main() {
  const options = parseArgs();
  const filter = buildFilter(options.feeds);
  let tick = 0;

  console.info(
    `Oracle realtime mock publisher started (feeds=${options.feeds.join(',')}, seed=${options.seed}, interval=${options.interval}ms)`
  );

  const timer = setInterval(async () => {
    const seed = options.seed + tick;
    const entries = await generateMockSamples({ seed, filter });
    let processed = 0;

    for (const entry of entries) {
      const result = await processPipeline({ feed: entry.feed, samples: entry.samples });
      if (result) {
        processed += 1;
      }
    }

    tick += 1;
    console.info(`oracle-mock-realtime: tick=${tick} processed=${processed}`);
  }, options.interval);

  const handleExit = () => {
    clearInterval(timer);
    console.info('Oracle realtime mock publisher stopped');
    process.exit(0);
  };

  process.on('SIGINT', handleExit);
  process.on('SIGTERM', handleExit);
}

main().catch(error => {
  console.error('Oracle realtime mock publisher failed', error);
  process.exit(1);
});
