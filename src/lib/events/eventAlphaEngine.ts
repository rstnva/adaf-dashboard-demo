// Event Alpha Engine: prioriza catalysts con impacto cuantificable
export interface EventCatalyst {
  id: string;
  category: 'macro' | 'governance' | 'protocol' | 'regulatory';
  severity: 'low' | 'medium' | 'high';
  timeToEventHours: number;
  affectedAssets: string[];
}

export interface EventAlphaScore {
  status: 'simulated';
  id: string;
  score: number;
  playbook: string;
  ttlMinutes: number;
}

export class EventAlphaEngine {
  static scoreCatalysts(catalysts: EventCatalyst[]): EventAlphaScore[] {
    return catalysts.map(catalyst => {
      const severityMultiplier = catalyst.severity === 'high' ? 1.5 : catalyst.severity === 'medium' ? 1.1 : 0.8;
      const urgencyBoost = Math.max(0.5, 6 / Math.max(catalyst.timeToEventHours, 1));
      const assetFactor = 1 + Math.min(catalyst.affectedAssets.length, 5) * 0.1;
      const score = Number((severityMultiplier * urgencyBoost * assetFactor).toFixed(2));

      return {
        status: 'simulated',
        id: catalyst.id,
        score,
        playbook: score > 2 ? 'Alertar desk y preparar cobertura' : 'Monitoreo intensivo',
        ttlMinutes: Math.max(30, catalyst.timeToEventHours * 12),
      };
    });
  }
}
