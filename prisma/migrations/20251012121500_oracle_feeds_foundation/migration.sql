-- Align legacy agent signals table with new Oracle Core schema
ALTER TABLE "signals" RENAME TO "agent_signals";

ALTER TABLE "agent_signals" RENAME CONSTRAINT "signals_pkey" TO "agent_signals_pkey";

ALTER INDEX "signals_fingerprint_key" RENAME TO "agent_signals_fingerprint_key";

-- Core Oracle feed registry
CREATE TABLE "feeds" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "precision" INTEGER,
    "ttlMs" INTEGER NOT NULL,
    "heartbeatMs" INTEGER NOT NULL,
    "quorumK" INTEGER NOT NULL,
    "quorumN" INTEGER NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'shadow',
    "tags" TEXT[],
    "version" INTEGER NOT NULL DEFAULT 1,
    "owner" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feeds_pkey" PRIMARY KEY ("id")
);

-- High-frequency oracle signal storage with historical revisions
CREATE TABLE "signals" (
    "feedId" TEXT NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL,
    "value" DECIMAL(65,30) NOT NULL,
    "unit" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "quorumOk" BOOLEAN NOT NULL,
    "stale" BOOLEAN NOT NULL DEFAULT false,
    "sourceCount" INTEGER NOT NULL DEFAULT 0,
    "aggregates" JSONB,
    "shadowRmse" DOUBLE PRECISION,
    "latencyMs" INTEGER,
    "roundId" TEXT,
    "referenceId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ok',
    "mode" TEXT NOT NULL DEFAULT 'shadow',
    "rev" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "signals_pkey" PRIMARY KEY ("feedId","ts")
);

-- Evidence captured per oracle update (price sources, transactions, etc.)
CREATE TABLE "evidence" (
    "id" TEXT NOT NULL,
    "feedId" TEXT NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL,
    "sourceId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "price" DECIMAL(65,30),
    "confidence" DOUBLE PRECISION,
    "roundId" TEXT,
    "transaction" TEXT,
    "blockNumber" BIGINT,
    "blockHash" TEXT,
    "payload" JSONB,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_pkey" PRIMARY KEY ("id")
);

-- Quarantine events for anomalous oracle updates
CREATE TABLE "quarantine_events" (
    "id" TEXT NOT NULL,
    "feedId" TEXT NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL,
    "rev" INTEGER NOT NULL DEFAULT 0,
    "ruleId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "zScore" DOUBLE PRECISION,
    "disputeRef" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "quarantine_events_pkey" PRIMARY KEY ("id")
);

-- Consumer read statistics for latency/staleness monitoring
CREATE TABLE "read_stats" (
    "id" TEXT NOT NULL,
    "feedId" TEXT NOT NULL,
    "readerId" TEXT NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL,
    "errorCode" TEXT,
    "stale" BOOLEAN NOT NULL DEFAULT false,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "read_stats_pkey" PRIMARY KEY ("id")
);

-- Structured news ingestion pipeline (events, analysis, triage)
CREATE TABLE "news_events" (
    "id" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "summary" TEXT,
    "category" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "tickers" TEXT[],
    "keywords" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'ingested',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "dedupedAt" TIMESTAMP(3),
    "standbyUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "news_analysis" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "sentiment" DOUBLE PRECISION,
    "impactScore" DOUBLE PRECISION,
    "confidenceScore" DOUBLE PRECISION,
    "riskLevel" TEXT NOT NULL DEFAULT 'moderate',
    "status" TEXT NOT NULL DEFAULT 'standby',
    "standbyReason" TEXT,
    "tags" TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_analysis_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "news_triage" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "escalatedTo" TEXT,
    "assignedTo" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_triage_pkey" PRIMARY KEY ("id")
);

-- Indexes to keep high-throughput queries performant
CREATE INDEX "feeds_category_idx" ON "feeds"("category");
CREATE INDEX "feeds_mode_idx" ON "feeds"("mode");

CREATE INDEX "signals_feed_ts_idx" ON "signals"("feedId", "ts" DESC);
CREATE INDEX "signals_status_idx" ON "signals"("status");
CREATE INDEX "signals_mode_idx" ON "signals"("mode");

CREATE INDEX "evidence_feedId_ts_idx" ON "evidence"("feedId", "ts");
CREATE INDEX "evidence_provider_idx" ON "evidence"("provider");

CREATE INDEX "quarantine_events_feedId_ts_idx" ON "quarantine_events"("feedId", "ts");
CREATE INDEX "quarantine_events_status_idx" ON "quarantine_events"("status");

CREATE INDEX "read_stats_feedId_fetchedAt_idx" ON "read_stats"("feedId", "fetchedAt" DESC);
CREATE INDEX "read_stats_readerId_fetchedAt_idx" ON "read_stats"("readerId", "fetchedAt");

CREATE UNIQUE INDEX "news_events_fingerprint_key" ON "news_events"("fingerprint");
CREATE INDEX "news_events_status_priority_publishedAt_idx" ON "news_events"("status", "priority", "publishedAt");
CREATE INDEX "news_events_createdAt_idx" ON "news_events"("createdAt");

CREATE INDEX "news_analysis_status_riskLevel_idx" ON "news_analysis"("status", "riskLevel");
CREATE INDEX "news_triage_status_idx" ON "news_triage"("status");

-- Foreign keys for relational integrity
ALTER TABLE "signals" ADD CONSTRAINT "signals_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "feeds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "evidence" ADD CONSTRAINT "evidence_feedId_ts_fkey" FOREIGN KEY ("feedId", "ts") REFERENCES "signals"("feedId", "ts") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "quarantine_events" ADD CONSTRAINT "quarantine_events_feedId_ts_fkey" FOREIGN KEY ("feedId", "ts") REFERENCES "signals"("feedId", "ts") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "read_stats" ADD CONSTRAINT "read_stats_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "feeds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "news_analysis" ADD CONSTRAINT "news_analysis_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "news_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "news_triage" ADD CONSTRAINT "news_triage_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "news_analysis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

