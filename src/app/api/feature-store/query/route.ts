// Next.js API Route - Feature Store Query
import type { NextRequest } from 'next/server';
import { withRateLimit } from '@/middleware/withRateLimit';
import { POST_query } from '@services/feature-store/serve/api/rest';

export async function POST(request: NextRequest) {
  return withRateLimit(request, (req: NextRequest) => POST_query(req));
}
