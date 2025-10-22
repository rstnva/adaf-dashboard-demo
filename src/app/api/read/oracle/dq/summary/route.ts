import { NextRequest, NextResponse } from 'next/server';

import { requirePermission } from '@/lib/auth/rbac';
import { getDataQualitySummary } from '@services/oracle-core/dq/summary';

export async function GET(request: NextRequest) {
  try {
    await requirePermission('feature:news_oracle');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'forbidden';
    return NextResponse.json({ ok: false, error: message }, { status: 403 });
  }

  const feedId = request.nextUrl.searchParams.get('feed') ?? undefined;

  try {
    const summary = await getDataQualitySummary(feedId ? { feedId } : {});
    return NextResponse.json(
      {
        ok: true,
        summary,
        generatedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'dq_summary_error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
