#!/usr/bin/env ts-node
import process from 'node:process';

import { generateMockSamples } from './generator';
import { processPipeline } from '../pipeline';
import type { Feed } from '../registry/schema';

interface CliOptions {
  feeds: string[];
  seed: number;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    feeds: (process.env.ORACLE_MOCK_FEEDS ?? 'wsp/*,news/*').split(','),
    seed: Number(process.env.ORACLE_DEMO_SEED ?? 42),
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--feeds' && args[i + 1]) {
      options.feeds = args[i + 1].split(',');
      i += 1;
    } else if (arg === '--seed' && args[i + 1]) {
      options.seed = Number(args[i + 1]);
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
  const entries = await generateMockSamples({ seed: options.seed, filter });

  let processed = 0;

  for (const entry of entries) {
    const result = await processPipeline({ feed: entry.feed, samples: entry.samples });
    if (result) {
      processed += 1;
    }
  }

  console.info(`Oracle mock batch published ${processed} signals (seed=${options.seed})`);
}

main().catch(error => {
  console.error('Oracle mock batch failed', error);
  process.exit(1);
});
