export type CeFiVenue = 'binance' | 'okx' | 'bybit' | 'kraken';

export interface CeFiOrderRequest {
  readonly venue: CeFiVenue;
  readonly symbol: string;
  readonly side: 'buy' | 'sell';
  readonly quantity: number;
  readonly price?: number;
  readonly type: 'market' | 'limit';
  readonly clientOrderId?: string;
}

export interface CeFiOrderResponse {
  readonly venue: CeFiVenue;
  readonly orderId: string;
  readonly status: 'accepted' | 'rejected' | 'filled' | 'partial';
  readonly filledQuantity: number;
  readonly averagePrice?: number;
  readonly executedAt: Date;
}

export interface CeFiPort {
  placeOrder(order: CeFiOrderRequest): Promise<CeFiOrderResponse>;
  cancelOrder(venue: CeFiVenue, orderId: string): Promise<boolean>;
  getOpenOrders(venue: CeFiVenue): Promise<readonly CeFiOrderResponse[]>;
}
