const revisions = new Map<string, number>();

export function nextRevision(feedId: string): number {
  const current = revisions.get(feedId) ?? 0;
  const next = current + 1;
  revisions.set(feedId, next);
  return next;
}
