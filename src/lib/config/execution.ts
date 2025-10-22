export type ExecutionMode = 'dry-run' | 'paper' | 'live';

const execMode = (process.env.NEXT_PUBLIC_EXECUTION_MODE || 'dry-run') as ExecutionMode;

export const EXECUTION_CONFIG = {
  mode: execMode,
  isDryRun: execMode !== 'live',
  allowSettlement: execMode === 'live',
} as const;

export function requireDryRun() {
  if (EXECUTION_CONFIG.mode !== 'dry-run') {
    throw new Error('Esta operación sólo está permitida en modo dry-run.');
  }
}
