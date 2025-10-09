import { NextResponse } from 'next/server';

export async function GET() {
  const mockRows = [
    {
      source: 'ETF_FLOWS',
      agent_code: 'NM',
      type: 'VALIDATION',
      status: 'ok',
      last_check: new Date().toISOString(),
      issues: 0,
      quality_score: 98.5
    },
    {
      source: 'ONCHAIN_DATA',
      agent_code: 'OC', 
      type: 'SCHEMA',
      status: 'warn',
      last_check: new Date(Date.now() - 60000).toISOString(),
      issues: 2,
      quality_score: 87.3
    }
  ];

  return NextResponse.json({
    rows: mockRows,
    generatedAt: new Date().toISOString()
  });
}
