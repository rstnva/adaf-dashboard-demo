// Next.js API Route - Feature Store Latest Point
import type { NextRequest } from 'next/server';
import { withRateLimit } from '@/middleware/withRateLimit';
import { GET_latest } from '@services/feature-store/serve/api/rest';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  return withRateLimit(request, (req: NextRequest) => GET_latest(req, context));
}
