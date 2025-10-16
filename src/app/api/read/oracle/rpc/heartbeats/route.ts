import { NextResponse } from 'next/server';

import { requirePermission } from '@/lib/auth/rbac';
import { getRpcHeartbeatTable } from '../../../../../../../../../services/oracle-core/monitoring/heartbeats';

export async function GET() {
  try {
    await requirePermission('feature:news_oracle');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'forbidden';
    return NextResponse.json({ ok: false, error: message }, { status: 403 });
  }

  try {
    const heartbeats = getRpcHeartbeatTable();
    return NextResponse.json(
      {
        ok: true,
        heartbeats,
        generatedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'rpc_heartbeats_error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
