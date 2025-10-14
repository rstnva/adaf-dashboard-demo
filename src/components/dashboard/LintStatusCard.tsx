import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CheckCircle, Clock, Info, TriangleAlert } from 'lucide-react';
import Link from 'next/link';

const ESLINT_MOCK_DATA = {
  preset: 'Fortune 500 · Strict Flat Config',
  lastRun: '2025-10-14 02:30 UTC',
  filesScanned: 412,
  errors: 0,
  warnings: 5,
  topWarnings: [
    {
      rule: 'react-hooks/exhaustive-deps',
      occurrences: 2,
      status: 'warn',
      component: 'StrategyOverviewPanel.tsx',
    },
    {
      rule: '@typescript-eslint/no-unused-vars',
      occurrences: 2,
      status: 'warn',
      component: 'lib/agents/simulator.ts',
    },
    {
      rule: 'no-console',
      occurrences: 1,
      status: 'ignored',
      component: 'api/monitoring/proxy.ts',
    },
  ],
};

const metricStyles: Record<'success' | 'warn', string> = {
  success: 'text-emerald-600',
  warn: 'text-amber-600',
};

export function LintStatusCard() {
  const passRate =
    ESLINT_MOCK_DATA.filesScanned === 0
      ? 100
      : ((ESLINT_MOCK_DATA.filesScanned -
          ESLINT_MOCK_DATA.warnings -
          ESLINT_MOCK_DATA.errors) /
          ESLINT_MOCK_DATA.filesScanned) *
        100;

  return (
    <Card className="border-l-4 border-l-emerald-500 bg-white">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg text-slate-900">
              ESLint Governance
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Gobernanza Fortune 500 de linting"
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600 transition-colors hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  align="start"
                  side="top"
                  className="max-w-xs text-left leading-snug"
                >
                  <p className="font-semibold">Gobernanza Fortune 500</p>
                  <p className="mt-1 text-xs opacity-90">
                    Alineamos el linting con estándares institucionales: errores
                    en cero, warnings con ownership claro y seguimiento desde
                    CI/CD. Este panel usa datos mock para demos mientras
                    conectamos el pipeline real.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-sm text-muted-foreground">
            Health check de linting (datos demo)
          </p>
        </div>
        <Badge
          variant="outline"
          className="bg-emerald-50 text-emerald-600 border-emerald-200"
        >
          Mock Mode
        </Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-lg bg-emerald-50 p-3">
            <div className="text-xs text-emerald-700">Errores</div>
            <div className="text-2xl font-semibold text-emerald-700">
              {ESLINT_MOCK_DATA.errors}
            </div>
          </div>
          <div className="rounded-lg bg-amber-50 p-3">
            <div className="text-xs text-amber-700">Warnings</div>
            <div className="text-2xl font-semibold text-amber-700">
              {ESLINT_MOCK_DATA.warnings}
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="text-xs text-slate-600">Archivos escaneados</div>
            <div className="text-2xl font-semibold text-slate-700">
              {ESLINT_MOCK_DATA.filesScanned}
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="text-xs text-slate-600">Pass rate</div>
            <div className="text-2xl font-semibold text-emerald-700">
              {passRate.toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">
                Preset aplicado
              </p>
              <p className="text-xs text-muted-foreground">
                {ESLINT_MOCK_DATA.preset}
              </p>
            </div>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Última corrida: {ESLINT_MOCK_DATA.lastRun}
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">
            Top findings demo
          </p>
          <div className="space-y-2">
            {ESLINT_MOCK_DATA.topWarnings.map(issue => {
              const isWarning = issue.status !== 'ignored';
              const Icon = isWarning ? TriangleAlert : CheckCircle;
              const tone = isWarning ? metricStyles.warn : metricStyles.success;

              return (
                <div
                  key={`${issue.rule}-${issue.component}`}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${tone}`} />
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        {issue.rule}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {issue.occurrences} ocurrencias · {issue.component}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={isWarning ? 'outline' : 'secondary'}
                    className={tone}
                  >
                    {isWarning ? 'Atender' : 'Ignorado'}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
          <span>Datos mock para demo institucional</span>
          <Button asChild size="sm" variant="ghost" className="text-xs">
            <Link href="/control">Ver políticas de linting</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
