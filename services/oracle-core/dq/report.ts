import { listQuarantinedFeeds } from './quarantine';
import { getQuarantineEvents, type QuarantineEvent } from './vox.rules';

export interface DqReportSummary {
  quarantinedCount: number;
  feeds: ReturnType<typeof listQuarantinedFeeds>;
  voxQuarantineEvents: QuarantineEvent[];
  generatedAt: string;
}

export function buildDqReport(): DqReportSummary {
  const feeds = listQuarantinedFeeds();
  const voxEvents = getQuarantineEvents();
  return {
    quarantinedCount: feeds.length + voxEvents.length,
    feeds,
    voxQuarantineEvents: voxEvents,
    generatedAt: new Date().toISOString(),
  };
}
