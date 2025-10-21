// Vox Populi alerting system
export interface VoxAlert {
  code: string;
  asset: string;
  value: number;
  threshold: number;
  timestamp: string;
  correlation_id: string;
}

export async function sendVoxAlert(alert: VoxAlert) {
  const webhookUrl = process.env.VOX_ALERT_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('[VOX ALERT] No webhook configured, skipping alert:', alert.code);
    return;
  }
  
  const payload = {
    text: `🚨 VOX ALERT ${alert.code}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Alert:* ${alert.code}\n*Asset:* ${alert.asset}\n*Value:* ${alert.value}\n*Threshold:* ${alert.threshold}\n*Correlation ID:* ${alert.correlation_id}`,
        },
      },
    ],
  };
  
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    if (!res.ok) {
      console.error('[VOX ALERT] Failed to send webhook:', res.status);
    } else {
      console.log(`[VOX ALERT] Sent ${alert.code} for ${alert.asset}`);
    }
  } catch (error) {
    console.error('[VOX ALERT] Webhook error:', error);
  }
}

// ALR-VOX-001: Sentiment shock
export async function checkShockAlert(asset: string, shockZ: number, threshold: number = 2.5) {
  if (Math.abs(shockZ) > threshold) {
    await sendVoxAlert({
      code: 'ALR-VOX-001',
      asset,
      value: shockZ,
      threshold,
      timestamp: new Date().toISOString(),
      correlation_id: Math.random().toString(36).slice(2, 10),
    });
  }
}

// ALR-VOX-002: Divergence HP
export async function checkDivergenceAlert(asset: string, divergence: number, threshold: number = 0.4) {
  if (divergence > threshold) {
    await sendVoxAlert({
      code: 'ALR-VOX-002',
      asset,
      value: divergence,
      threshold,
      timestamp: new Date().toISOString(),
      correlation_id: Math.random().toString(36).slice(2, 10),
    });
  }
}

// ALR-VOX-003: Brigading detected
export async function checkBrigadingAlert(asset: string, score: number, threshold: number = 70) {
  if (score > threshold) {
    await sendVoxAlert({
      code: 'ALR-VOX-003',
      asset,
      value: score,
      threshold,
      timestamp: new Date().toISOString(),
      correlation_id: Math.random().toString(36).slice(2, 10),
    });
  }
}
