import { describe, it, expect } from 'vitest';
import fetch from 'node-fetch';

describe('@integration Oracle Shadow Metrics', () => {
  it('shadow_rmse presente y live_reads_total > 0', async () => {
    const metrics = await fetch(
      'http://localhost:3005/api/oracle/v1/metrics/wsp'
    ).then(r => r.text());
    expect(metrics).toMatch(/shadow_rmse/);
    expect(metrics).toMatch(/oracle_live_reads_total [1-9]/);
  });
});
