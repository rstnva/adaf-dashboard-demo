// API simulada para cálculo de rebates
import { RebateCalculator } from '@/lib/blockspace/rebates';

export async function POST(req: Request) {
  const { volume } = await req.json();
  const result = RebateCalculator.calculate(volume);
  return Response.json(result);
}
