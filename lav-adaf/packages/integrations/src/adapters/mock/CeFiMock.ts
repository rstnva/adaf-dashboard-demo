import { randomUUID } from 'crypto';
import type {
  CeFiPort,
  CeFiOrderRequest,
  CeFiOrderResponse,
  CeFiVenue,
} from '../../ports/CeFi';

export class CeFiMock implements CeFiPort {
  private readonly orders = new Map<string, CeFiOrderResponse>();

  async placeOrder(order: CeFiOrderRequest): Promise<CeFiOrderResponse> {
    const orderId = order.clientOrderId ?? randomUUID();
    const response: CeFiOrderResponse = {
      venue: order.venue,
      orderId,
      status: 'filled',
      filledQuantity: order.quantity,
      averagePrice: order.price ?? this.mockPrice(order.symbol),
      executedAt: new Date(),
    };
    this.orders.set(orderId, response);
    return response;
  }

  async cancelOrder(_venue: CeFiVenue, orderId: string): Promise<boolean> {
    return this.orders.delete(orderId);
  }

  async getOpenOrders(venue: CeFiVenue): Promise<readonly CeFiOrderResponse[]> {
    return Array.from(this.orders.values()).filter(
      order => order.venue === venue
    );
  }

  private mockPrice(symbol: string): number {
    if (symbol.toUpperCase().includes('BTC'))
      return 68000 + Math.random() * 1000;
    if (symbol.toUpperCase().includes('ETH')) return 2900 + Math.random() * 80;
    return 1;
  }
}
