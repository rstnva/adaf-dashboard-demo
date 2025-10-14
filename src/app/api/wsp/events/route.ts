// API route: GET /api/wsp/events
import { NextRequest } from 'next/server';
// TODO: Import auto-react engine

export async function GET(_req: NextRequest) {
  // TODO: Generar señales activas
  return new Response(JSON.stringify([]), { status: 200 });
}
