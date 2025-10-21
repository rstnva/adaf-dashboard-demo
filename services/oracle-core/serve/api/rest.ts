import type { NextRequest } from 'next/server';

import { ensureScope, type AccessToken } from '../../acl/rbac';
import { loadFeeds, getFeedById } from '../../registry/feeds';
import { validateSignal } from '../../registry/schema';
import { getProvenance } from '../../lineage/provenance';
import { fetchLatestSignal, querySignals, storeSignal } from '../../storage/pg';
import { evaluateSignal } from '../../dq/rules';
import { quarantineSignal } from '../../dq/quarantine';
import { dqFailureTotal, dqEvaluationsTotal } from '../../metrics/oracle.metrics';
import { getGuardrails, getGuardrailManifest, getGuardrailManifestMetadata } from '../../dq/guardrails';
import { getDataQualitySummary } from '../../dq/summary';
import { ensurePublisherAllowed } from '../../registry/feed-policies';
import { getRpcHeartbeatTable } from '../../monitoring/heartbeats';

export async function listFeeds() {
  const feeds = await loadFeeds();
  return Response.json({ feeds });
}

export async function getLatest(request: NextRequest, params: { id: string }) {
  const feedId = params.id;
  const signal = await fetchLatestSignal(feedId);

  if (!signal) {
    return new Response('Not found', { status: 404 });
  }

  const headers = new Headers();
  if (signal.stale) {
    headers.set('X-Data', 'stale');
  }

  return new Response(JSON.stringify(signal), {
    status: 200,
    headers,
  });
}

export async function postQuery(request: NextRequest) {
  const body = await request.json();
  const feedIds: string[] = body.feedIds ?? [];
  const since = body.since as string | undefined;
  const until = body.until as string | undefined;

  if (!Array.isArray(feedIds) || feedIds.length === 0) {
    return new Response('feedIds required', { status: 400 });
  }

  const result = await querySignals(feedIds, since, until);
  return Response.json(result);
}

export async function postPublish(request: NextRequest, token: AccessToken | null) {
  ensureScope(token, 'oracle.publisher');

  const payload = await request.json();
  const signal = validateSignal(payload);

  const feed = await getFeedById(signal.feedId);
  if (!feed) {
    return new Response('Unknown feed', { status: 400 });
  }

  try {
    await ensurePublisherAllowed(feed, token?.subject ?? null);
  } catch (error) {
    const statusCode = (error as any)?.statusCode ?? 403;
    const message = error instanceof Error ? error.message : 'Forbidden';
    return new Response(message, { status: statusCode });
  }

  const previous = await fetchLatestSignal(signal.feedId);
  const guardrails = await getGuardrails(signal.feedId, feed.category);
  const dq = evaluateSignal(signal, { feed, previous, guardrails });
  dq.checks.forEach(({ rule, passed }) =>
    dqEvaluationsTotal.inc({ feed: feed.id, rule: rule.id, outcome: passed ? 'pass' : 'fail' })
  );
  if (!dq.valid) {
    dq.failures.forEach(rule => dqFailureTotal.inc({ feed: feed.id, rule: rule.id }));
      await quarantineSignal(signal, {
        reason: 'dq_failure',
        ruleIds: dq.failures.map(rule => rule.id),
        metadata: {
          checks: dq.checks,
        },
      });
    return new Response('Signal quarantined', { status: 422 });
  }

  await storeSignal(signal);
  return Response.json({ ok: true, rev: signal.rev });
}

export async function getProvenanceHandler(params: { signalId: string }) {
  const provenance = getProvenance(params.signalId);
  if (!provenance.length) {
    return new Response('Not found', { status: 404 });
  }
  return Response.json({ evidence: provenance });
}

export async function getHealth() {
  return Response.json({
    status: 'ok',
    db: true,
    redis: true,
    tsdb: true,
    s3: true,
    generatedAt: new Date().toISOString(),
  });
}

export async function getGuardrailsManifestHandler(request: NextRequest, token: AccessToken | null) {
  ensureScope(token, 'oracle.reader');

  const reload = request.nextUrl.searchParams.get('reload') === 'true';
  const manifest = await getGuardrailManifest({ reload });
  const metadata = getGuardrailManifestMetadata();
  return Response.json({ manifest, metadata, reloaded: reload, generatedAt: new Date().toISOString() });
}

export async function getDataQualitySummaryHandler(request: NextRequest, token: AccessToken | null) {
  ensureScope(token, 'oracle.reader');

  const feedId = request.nextUrl.searchParams.get('feed') ?? undefined;
  const summary = await getDataQualitySummary(feedId ? { feedId } : {});
  return Response.json({ summary, generatedAt: new Date().toISOString() });
}

export async function getRpcHeartbeatsHandler(token: AccessToken | null) {
  ensureScope(token, 'oracle.reader');
  const table = getRpcHeartbeatTable();
  return Response.json({ heartbeats: table, generatedAt: new Date().toISOString() });
}
