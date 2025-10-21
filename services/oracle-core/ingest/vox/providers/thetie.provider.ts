/**
 * The Tie provider client placeholder for Vox Populi ingestion.
 */
export interface TheTieOptions {
  asset: string;
  granularity?: '1m' | '5m' | '1h';
}

export async function fetchTheTieSentiment(_opts: TheTieOptions) {
  // TODO: integrate The Tie institutional sentiment feed when credentials available.
  return {
    sentimentSeries: [],
  };
}
