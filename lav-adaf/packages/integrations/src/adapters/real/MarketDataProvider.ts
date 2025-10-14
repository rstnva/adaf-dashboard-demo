import type {
  MarketDataPort,
  MarketPricePoint,
  FundingRatePoint,
} from '../../ports/MarketData';

/**
 * Placeholder para integración real (DefiLlama, Glassnode, etc.).
 * Implementar cuando USE_MOCKS=false.
 */
export class MarketDataProvider implements MarketDataPort {
  async getSpotPrice(_asset: string): Promise<MarketPricePoint> {
    throw new Error(
      'MarketDataProvider no implementado. Conecta DefiLlama/Glassnode.'
    );
  }

  async getHistoricalPrices(
    _asset: string,
    _hours: number
  ): Promise<readonly MarketPricePoint[]> {
    throw new Error('MarketDataProvider no implementado.');
  }

  async getFundingRates(
    _asset: string,
    _hours: number
  ): Promise<readonly FundingRatePoint[]> {
    throw new Error('MarketDataProvider no implementado.');
  }
}
