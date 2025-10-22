// Next.js API Route - Feature Store Latest Point
import type { NextRequest } from 'next/server';
import { withRateLimit } from '@/middleware/withRateLimit';
import { GET_latest } from '@services/feature-store/serve/api/rest';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  return withRateLimit(request, (req: NextRequest) => GET_latest(req, { params: resolvedParams }));
}
