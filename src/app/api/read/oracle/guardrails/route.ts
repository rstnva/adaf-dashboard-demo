import { NextRequest, NextResponse } from 'next/server';

import { requirePermission } from '@/lib/auth/rbac';
import {
  getGuardrailManifest,
  getGuardrailManifestMetadata,
} from '../../../../../../services/oracle-core/dq/guardrails';

export async function GET(request: NextRequest) {
  try {
    await requirePermission('feature:news_oracle');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'forbidden';
    return NextResponse.json({ ok: false, error: message }, { status: 403 });
  }

  const reload = request.nextUrl.searchParams.get('reload') === 'true';

  try {
    const manifest = await getGuardrailManifest({ reload });
    const metadata = getGuardrailManifestMetadata();
    return NextResponse.json(
      {
        ok: true,
        manifest,
        metadata,
        reloaded: reload,
        generatedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'guardrail_load_error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
