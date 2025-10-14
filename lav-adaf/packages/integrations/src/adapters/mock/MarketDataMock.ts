import { randomUUID } from 'crypto';
import type {
  MarketDataPort,
  MarketPricePoint,
  FundingRatePoint,
} from '../../ports/MarketData';

export interface MarketDataMockConfig {
  readonly seed?: number;
  readonly basePrices?: Partial<Record<string, number>>;
}

export class MarketDataMock implements MarketDataPort {
  private readonly basePrices: Map<string, number>;
  private readonly seed: number;
  private counter = 0;

  constructor(config?: MarketDataMockConfig) {
    this.basePrices = new Map(
      Object.entries(config?.basePrices ?? { BTC: 68000, ETH: 2900, USDC: 1 })
    );
    this.seed = config?.seed ?? Number.parseInt(randomUUID().slice(0, 8), 16);
  }

  async getSpotPrice(asset: string): Promise<MarketPricePoint> {
    const price = this.basePrices.get(asset.toUpperCase()) ?? 1000;
    return {
      asset: asset.toUpperCase(),
      price: this.jitter(price, 0.015),
      timestamp: new Date(),
      volumeUsd: this.jitter(price * 1500, 0.2),
    };
  }

  async getHistoricalPrices(
    asset: string,
    hours: number
  ): Promise<readonly MarketPricePoint[]> {
    const basePrice = this.basePrices.get(asset.toUpperCase()) ?? 1000;
    const now = Date.now();
    const points: MarketPricePoint[] = [];
    for (let i = hours; i >= 0; i -= 1) {
      const timestamp = new Date(now - i * 3600 * 1000);
      const trend = Math.sin((i / Math.max(1, hours)) * Math.PI * 2) * 0.02;
      const price = basePrice * (1 + trend) + this.randomNoise();
      points.push({
        asset: asset.toUpperCase(),
        price,
        timestamp,
        volumeUsd: this.jitter(basePrice * 1200, 0.15),
      });
    }
    return points;
  }

  async getFundingRates(
    asset: string,
    hours: number
  ): Promise<readonly FundingRatePoint[]> {
    const now = Date.now();
    const points: FundingRatePoint[] = [];
    for (let i = hours; i >= 0; i -= 1) {
      const timestamp = new Date(now - i * 3600 * 1000);
      const base = Math.sin((i / Math.max(1, hours)) * Math.PI) * 0.0005;
      points.push({
        asset: asset.toUpperCase(),
        exchange: 'PERP-MOCK',
        rate: base + this.randomNoise() * 0.0001,
        timestamp,
      });
    }
    return points;
  }

  private jitter(value: number, range: number): number {
    return value * (1 + (Math.random() - 0.5) * range * 2);
  }

  private randomNoise(): number {
    const x = Math.sin(this.seed + this.counter++) * 10000;
    return x - Math.floor(x);
  }
}
