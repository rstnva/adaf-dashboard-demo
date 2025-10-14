export interface MarketPricePoint {
  readonly asset: string;
  readonly timestamp: Date;
  readonly price: number;
  readonly volumeUsd?: number;
}

export interface FundingRatePoint {
  readonly asset: string;
  readonly exchange: string;
  readonly timestamp: Date;
  readonly rate: number;
}

export interface MarketDataPort {
  getSpotPrice(asset: string): Promise<MarketPricePoint>;
  getHistoricalPrices(
    asset: string,
    hours: number
  ): Promise<readonly MarketPricePoint[]>;
  getFundingRates(
    asset: string,
    hours: number
  ): Promise<readonly FundingRatePoint[]>;
}

export interface MarketDataContext {
  readonly useMocks: boolean;
}
