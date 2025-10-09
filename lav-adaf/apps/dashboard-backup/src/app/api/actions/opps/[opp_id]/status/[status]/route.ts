import { NextRequest, NextResponse } from 'next/server'

// Mock Prisma for build compatibility
const prisma = {
  opportunity: {
    update: async (options: { where: { id: string }, data: { status: string } }) => ({ id: options.where.id })
  },
  $executeRawUnsafe: async (query: string, ...args: string[]) => { console.log('Mock query:', query, args); return { count: 1 }; }
}

const ALLOWED = new Set(['proposed','approved','rejected'])

export async function POST(_req: NextRequest, { params }: { params: Promise<{ opp_id: string; status: string }> }) {
  const { opp_id, status } = await params
  if (!ALLOWED.has(status)) return NextResponse.json({ error: 'invalid status' }, { status: 400 })
  await prisma.$executeRawUnsafe(`UPDATE "opportunities" SET status = $1, "updatedAt" = NOW() WHERE id = $2`, status, opp_id)
  return NextResponse.json({ ok: true })
}
