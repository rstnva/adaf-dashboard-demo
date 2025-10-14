// Fortune 500-grade: Centralized ingestion handler factory and utilities
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export interface IngestHandlerOptions<T> {
  schema: { parse: (_payload: any) => T };
  dedupeKey: (_item: T) => string;
  getRedis: () => Promise<any>;
  classify?: (_item: T) => any;
  responseShape?: (_item: T, _hash: string, _extra?: any) => any;
  batchResponseShape?: (
    _signals: any[],
    _errors: any[],
    _processed: number
  ) => any;
}

export function createIngestHandler<T>({
  schema,
  dedupeKey,
  getRedis,
  classify,
  responseShape,
  batchResponseShape,
}: IngestHandlerOptions<T>) {
  return async function POST(request: NextRequest) {
    const body = await request.json();
    // Batch (array) mode
    if (Array.isArray(body)) {
      let processed = 0;
      let signals: any[] = [];
      let errors: any[] = [];
      for (const entry of body) {
        try {
          const item = schema.parse(entry);
          const hash = dedupeKey(item);
          const redis = await getRedis();
          const isNew = redis.setnx(`dedupe:${hash}`, '1');
          if (isNew) {
            const extra = classify ? classify(item) : {};
            signals.push(
              responseShape
                ? responseShape(item, hash, extra)
                : { ...item, fingerprint: hash }
            );
            processed++;
          }
        } catch (e) {
          errors.push(e);
        }
      }
      if (batchResponseShape) {
        return NextResponse.json(
          batchResponseShape(signals, errors, processed),
          { status: 200 }
        );
      }
      return NextResponse.json({ processed, signals, errors }, { status: 200 });
    }
    // Single item
    let item: T;
    try {
      item = schema.parse(body);
    } catch (e: any) {
      return NextResponse.json(
        { success: false, error: 'validation error', details: e.errors || e },
        { status: 400 }
      );
    }
    const hash = dedupeKey(item);
    const redis = await getRedis();
    const isNew = redis.setnx(`dedupe:${hash}`, '1');
    if (!isNew) {
      return NextResponse.json(
        { success: false, error: 'already exists', fingerprint: hash },
        { status: 409 }
      );
    }
    const extra = classify ? classify(item) : {};
    return NextResponse.json(
      responseShape
        ? responseShape(item, hash, extra)
        : { success: true, signalId: hash, fingerprint: hash, ...extra },
      { status: 201 }
    );
  };
}
