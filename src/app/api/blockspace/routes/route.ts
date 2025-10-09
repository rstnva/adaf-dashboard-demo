// API simulada para envío de bundles a relays
import { BlockspaceRelayService } from '@/lib/blockspace/relays';

export async function POST(req: Request) {
  const bundle = await req.json();
  const result = BlockspaceRelayService.simulateRelay(bundle);
  return Response.json(result);
}
