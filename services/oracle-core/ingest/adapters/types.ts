import type { Feed } from '../../registry/schema';
import type { RawSample } from '../../pipeline';

export interface AdapterRequest {
  feed: Feed;
  sourceId: string;
  weight: number;
  now: Date;
}

export type AdapterHandler = (_request: AdapterRequest) => Promise<RawSample | null>;

export interface AdapterOptions {
  now?: Date;
}
