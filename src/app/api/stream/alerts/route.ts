import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const encoder = new TextEncoder()
  let counter = 0
  let isClosed = false

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial comment to keep connection open
      try {
        controller.enqueue(encoder.encode(':ok\n\n'))
      } catch (error) {
        console.log('Stream already closed on start')
        return
      }
      
      // Mock alert generator
      async function tick() {
        if (isClosed) return // Don't continue if closed
        
        try {
          counter++
          if (counter % 5 === 0) { // Send alert every 5 ticks (10 seconds)
            const mockAlert = {
              id: Math.floor(Math.random() * 1000),
              title: `Mock Alert ${counter}`,
              description: `This is a mock alert generated at ${new Date().toLocaleTimeString()}`,
              createdAt: new Date().toISOString(),
              severity: ['sev1', 'sev2', 'sev3'][Math.floor(Math.random() * 3)]
            }
            const chunk = `data: ${JSON.stringify(mockAlert)}\n\n`
            controller.enqueue(encoder.encode(chunk))
          } else {
            // Send heartbeat
            controller.enqueue(encoder.encode(':heartbeat\n\n'))
          }
        } catch (error) {
          console.log('Stream closed during tick, cleaning up...')
          isClosed = true
        }
      }
      
      const interval = setInterval(() => { 
        if (!isClosed) {
          tick().catch(() => {
            console.log('Tick error, marking as closed')
            isClosed = true
          })
        }
      }, 2000) // Every 2 seconds
      
      // Cleanup on abort (with timeout fallback)
      setTimeout(() => {
        isClosed = true
        clearInterval(interval)
        try {
          controller.close()
        } catch (error) {
          // Already closed
        }
      }, 300000) // Close after 5 minutes
    },
    
    cancel() {
      console.log('Stream cancelled by client')
      isClosed = true
    }
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    }
  })
}
