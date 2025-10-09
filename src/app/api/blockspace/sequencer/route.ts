// API simulada para gestión de alianzas de secuenciadores
import { SequencerAllianceManager } from '@/lib/blockspace/sequencer';

export async function GET() {
  const alliances = SequencerAllianceManager.getAlliances();
  return Response.json({ alliances });
}
