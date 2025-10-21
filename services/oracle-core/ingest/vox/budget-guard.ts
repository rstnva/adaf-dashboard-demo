// Provider budget guard for Vox Populi
let callCount = 0;
let lastResetTime = Date.now();

export function checkProviderBudget(budgetPerMin: number = 200): boolean {
  const now = Date.now();
  const elapsed = now - lastResetTime;
  
  // Reset counter every minute
  if (elapsed > 60000) {
    callCount = 0;
    lastResetTime = now;
  }
  
  if (callCount >= budgetPerMin) {
    return false; // Budget exceeded
  }
  
  callCount++;
  return true;
}

export function getProviderUsage(): { calls: number; limit: number; remaining: number } {
  const budget = parseInt(process.env.VOX_PROVIDER_BUDGET_PER_MIN || '200', 10);
  return {
    calls: callCount,
    limit: budget,
    remaining: Math.max(0, budget - callCount),
  };
}
