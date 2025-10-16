// BlockspaceExecutionDesk: orquesta rutas de ejecución simuladas
export type ExecutionVenue = 'relay' | 'builder' | 'sequencer';

export interface DeskOrder {
  id: string;
  notionalUsd: number;
  priority: 'normal' | 'fast' | 'critical';
  venue: ExecutionVenue;
  clientTier: 'basic' | 'plus' | 'pro';
}

export interface DeskExecution {
  status: 'simulated';
  orderId: string;
  venue: ExecutionVenue;
  accepted: boolean;
  feeBps: number;
  notes?: string;
}

export class BlockspaceExecutionDesk {
  static route(order: DeskOrder): DeskExecution {
    const baseFee = order.priority === 'critical' ? 15 : order.priority === 'fast' ? 10 : 6;
    const tierDiscount = order.clientTier === 'pro' ? 4 : order.clientTier === 'plus' ? 2 : 0;
    const venuePremium = order.venue === 'builder' ? 3 : order.venue === 'sequencer' ? 2 : 1;

    const feeBps = Math.max(2, baseFee + venuePremium - tierDiscount);
    const accepted = order.notionalUsd <= 5_000_000;

    return {
      status: 'simulated',
      orderId: order.id,
      venue: order.venue,
      accepted,
      feeBps,
      notes: accepted ? undefined : 'Dry-run desk rechazó orden por tamaño > $5M',
    };
  }
}
