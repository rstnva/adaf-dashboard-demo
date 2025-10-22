import { beforeEach, describe, expect, it } from 'vitest';

import { getDataQualitySummary, resetDataQualitySummaryCache } from '../services/oracle-core/dq/summary';
import { dqEvaluationsTotal } from '../services/oracle-core/metrics/oracle.metrics';

describe('oracle data quality summary', () => {
  beforeEach(() => {
    dqEvaluationsTotal.reset();
    resetDataQualitySummaryCache();
  });

  it('aggregates pass and fail counts per feed and rule', async () => {
    dqEvaluationsTotal.inc({ feed: 'feed-a', rule: 'range', outcome: 'pass' }, 3);
    dqEvaluationsTotal.inc({ feed: 'feed-a', rule: 'range', outcome: 'fail' }, 5);
    dqEvaluationsTotal.inc({ feed: 'feed-a', rule: 'delta', outcome: 'fail' }, 2);
    dqEvaluationsTotal.inc({ feed: 'feed-b', rule: 'range', outcome: 'pass' }, 5);

    const summary1 = await getDataQualitySummary();

    expect(summary1.totals.total).toBe(15);
    expect(summary1.totals.pass).toBe(8);
    expect(summary1.totals.fail).toBe(7);
    expect(summary1.totals.severity.status).toBe('warning');
    expect(summary1.totals.trend.status).toBe('stable');

    const feedAFirst = summary1.feeds.find(feed => feed.feed === 'feed-a');
    expect(feedAFirst?.severity.status).toBe('warning');
    expect(feedAFirst?.trend.status).toBe('stable');

    const rangeRuleFirst = feedAFirst?.rules.find(rule => rule.rule === 'range');
    expect(rangeRuleFirst?.severity.status).toBe('warning');
    expect(rangeRuleFirst?.trend.status).toBe('stable');

    const deltaRuleFirst = feedAFirst?.rules.find(rule => rule.rule === 'delta');
  expect(deltaRuleFirst?.severity.status).toBe('warning');
    expect(deltaRuleFirst?.trend.status).toBe('stable');

  dqEvaluationsTotal.inc({ feed: 'feed-a', rule: 'range', outcome: 'fail' }, 5);
    dqEvaluationsTotal.inc({ feed: 'feed-a', rule: 'delta', outcome: 'fail' }, 3);

    const summary2 = await getDataQualitySummary();

    expect(summary2.totals.total).toBe(23);
    expect(summary2.totals.pass).toBe(8);
    expect(summary2.totals.fail).toBe(15);
    expect(summary2.totals.severity.status).toBe('critical');
    expect(summary2.totals.trend.status).toBe('deteriorating');
  expect(summary2.totals.trend.delta.fail).toBe(8);
  expect(summary2.totals.trend.delta.failureRatio).toBeCloseTo(0.1855, 4);

    const feedASecond = summary2.feeds.find(feed => feed.feed === 'feed-a');
    expect(feedASecond?.severity.status).toBe('critical');
    expect(feedASecond?.trend.status).toBe('deteriorating');

    const deltaRuleSecond = feedASecond?.rules.find(rule => rule.rule === 'delta');
    expect(deltaRuleSecond?.fail).toBe(5);
    expect(deltaRuleSecond?.trend.status).toBe('deteriorating');

  const rangeRuleSecond = feedASecond?.rules.find(rule => rule.rule === 'range');
  expect(rangeRuleSecond?.fail).toBe(10);
    expect(rangeRuleSecond?.severity.status).toBe('critical');
    expect(rangeRuleSecond?.trend.status).toBe('deteriorating');
  });

  it('filters by feed when requested', async () => {
    dqEvaluationsTotal.inc({ feed: 'feed-a', rule: 'range', outcome: 'pass' });
    dqEvaluationsTotal.inc({ feed: 'feed-b', rule: 'delta', outcome: 'fail' });

    const summary = await getDataQualitySummary({ feedId: 'feed-b' });
    expect(summary.feeds.length).toBe(1);
    expect(summary.feeds[0].feed).toBe('feed-b');
    expect(summary.feeds[0].fail).toBe(1);
    expect(summary.totals.fail).toBe(1);
    expect(summary.totals.pass).toBe(0);
  expect(summary.totals.severity.status).toBe('warning');
    expect(summary.totals.trend.status).toBe('stable');
  });
});
