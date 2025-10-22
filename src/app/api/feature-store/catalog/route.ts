// Next.js API Route - Feature Store Catalog
import type { NextRequest } from 'next/server';
import { withRateLimit } from '@/middleware/withRateLimit';
import { GET_catalog } from '@services/feature-store/serve/api/rest';

export async function GET(request: NextRequest) {
  return withRateLimit(request, (req: NextRequest) => GET_catalog(req));
}
