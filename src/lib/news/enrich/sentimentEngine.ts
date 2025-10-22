const POSITIVE_WORDS = [
  'surge',
  'growth',
  'bullish',
  'acquire',
  'partnership',
  'approval',
  'breakthrough',
  'launch',
  'support',
  'record',
];

const NEGATIVE_WORDS = [
  'hack',
  'exploit',
  'breach',
  'lawsuit',
  'ban',
  'reject',
  'delay',
  'collapse',
  'liquidation',
  'warning',
  'fail',
  'fraud',
];

export function lexiconSentiment(text: string): number {
  if (!text) return 0;

  const normalized = text.toLowerCase();
  let score = 0;

  for (const word of POSITIVE_WORDS) {
    if (normalized.includes(word)) {
      score += 1;
    }
  }

  for (const word of NEGATIVE_WORDS) {
    if (normalized.includes(word)) {
      score -= 1;
    }
  }

  return Math.max(-3, Math.min(3, score)) / 3; // normalize between -1 and 1
}
