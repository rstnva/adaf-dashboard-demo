import { listQuarantinedFeeds } from './quarantine';

export interface DqReportSummary {
  quarantinedCount: number;
  feeds: ReturnType<typeof listQuarantinedFeeds>;
  generatedAt: string;
}

export function buildDqReport(): DqReportSummary {
  const feeds = listQuarantinedFeeds();
  return {
    quarantinedCount: feeds.length,
    feeds,
    generatedAt: new Date().toISOString(),
  };
}
