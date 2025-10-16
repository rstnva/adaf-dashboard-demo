// Selective Market Maker: simula proveeduría de liquidez sólo en venues aprobados
export interface VenueProfile {
  id: string;
  name: string;
  qualityScore: number; // 0-1
  feeBps: number;
}

export interface MarketMakingMandate {
  asset: string;
  minInventoryUsd: number;
  maxInventoryUsd: number;
  targetSpreadBps: number;
}

export interface MarketMakingDecision {
  status: 'simulated';
  venueId: string;
  provideLiquidity: boolean;
  quotedSpreadBps: number;
  inventoryCapUsd: number;
}

export class SelectiveMarketMaker {
  static evaluate(
    mandate: MarketMakingMandate,
    venues: VenueProfile[]
  ): MarketMakingDecision[] {
    return venues.map(venue => {
      const provideLiquidity =
        venue.qualityScore >= 0.6 && venue.feeBps <= mandate.targetSpreadBps;
      const quotedSpreadBps = provideLiquidity
        ? Math.max(venue.feeBps + 2, mandate.targetSpreadBps)
        : mandate.targetSpreadBps + 15;

      return {
        status: 'simulated',
        venueId: venue.id,
        provideLiquidity,
        quotedSpreadBps,
        inventoryCapUsd: provideLiquidity
          ? mandate.maxInventoryUsd * venue.qualityScore
          : 0,
      };
    });
  }
}
