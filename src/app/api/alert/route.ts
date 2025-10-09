import { NextRequest, NextResponse } from 'next/server'

// POST /api/alert -> reenvía a un webhook (Slack, etc.) si está configurado
export async function POST(req: NextRequest) {
  try {
    const webhook = process.env.ALERT_WEBHOOK_URL
    const body = await req.json().catch(() => ({}))
    const base = {
      text: body?.text || 'ADAF Alert',
      level: body?.level || 'error',
      meta: body?.meta || {},
      ts: new Date().toISOString(),
    }

    if (!webhook) {
      // Si no hay webhook, retornamos 200 pero indicamos modo noop
      return NextResponse.json({ ok: true, noop: true, payload: base }, { status: 200 })
    }

    const isSlack = /hooks\.slack\.com\/services\//.test(webhook)
    const slackPayload = {
      text: base.text,
      blocks: [
        { type: 'header', text: { type: 'plain_text', text: `ADAF ${base.level.toUpperCase()}` } },
        { type: 'section', text: { type: 'mrkdwn', text: base.text } },
        { type: 'context', elements: [ { type: 'mrkdwn', text: `ts: ${base.ts}` } ] },
        base.meta && Object.keys(base.meta).length > 0
          ? { type: 'section', fields: Object.entries(base.meta).slice(0,10).map(([k,v]) => ({ type: 'mrkdwn', text: `*${k}:* ${String(v)}` })) }
          : undefined
      ].filter(Boolean)
    }
    const finalPayload = isSlack ? slackPayload : base
    const res = await fetch(webhook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(finalPayload),
    })
    const ok = res.ok
    const out = await res.text().catch(() => '')
    return NextResponse.json({ ok, response: out.slice(0, 2000) })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'unknown' }, { status: 500 })
  }
}
