import type {
  CeFiPort,
  CeFiOrderRequest,
  CeFiOrderResponse,
  CeFiVenue,
} from '../../ports/CeFi';

/**
 * Placeholder para integración con APIs CeFi (paper trading Binance/OKX).
 */
export class CeFiProvider implements CeFiPort {
  async placeOrder(_order: CeFiOrderRequest): Promise<CeFiOrderResponse> {
    throw new Error('CeFiProvider no implementado. Integra paper trading API.');
  }

  async cancelOrder(_venue: CeFiVenue, _orderId: string): Promise<boolean> {
    throw new Error('CeFiProvider no implementado.');
  }

  async getOpenOrders(
    _venue: CeFiVenue
  ): Promise<readonly CeFiOrderResponse[]> {
    throw new Error('CeFiProvider no implementado.');
  }
}
