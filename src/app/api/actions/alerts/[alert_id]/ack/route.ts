import { NextRequest, NextResponse } from 'next/server'

// Mock Prisma client for build compatibility
const prisma = {
  alert: {
    update: async (options: { where: { id: string }, data: { resolved: boolean, resolvedAt: Date } }) => ({ id: options.where.id })
  }
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ alert_id: string }> }) {
  const { alert_id } = await params
  await prisma.alert.update({ where: { id: alert_id }, data: { resolved: true, resolvedAt: new Date() } })
  return NextResponse.json({ ok: true })
}
