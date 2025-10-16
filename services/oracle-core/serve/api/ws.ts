import { EventEmitter } from 'node:events';

import type { Signal } from '../../registry/schema';

const emitter = new EventEmitter();

type Listener = (_signal: Signal) => void;

export function publishSignalUpdate(signal: Signal) {
  emitter.emit(signal.feedId, signal);
}

export function subscribeToFeed(feedId: string, listener: Listener): () => void {
  emitter.on(feedId, listener);
  return () => emitter.off(feedId, listener);
}

export function activeSubscribers(feedId?: string): number {
  if (!feedId) {
    return emitter.eventNames().reduce((acc, name) => acc + emitter.listenerCount(name), 0);
  }
  return emitter.listenerCount(feedId);
}
