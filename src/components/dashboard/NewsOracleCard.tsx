'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CircleSlash, Clock, Loader2, Newspaper } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useFeatureFlag } from '@/lib/featureFlags';
import { useNewsOracle } from '@/hooks';

function SeverityBadge({ risk }: { risk: string }) {
  const variant = risk === 'high' ? 'destructive' : risk === 'moderate' ? 'default' : 'outline';
  return (
    <Badge variant={variant} className="text-xs capitalize">
      {risk}
    </Badge>
  );
}

export function NewsOracleCard() {
  const isEnabled = useFeatureFlag('FF_NEWS_ORACLE_ENABLED');
  const { standby, triage, runPipeline } = useNewsOracle(isEnabled);

  const standbyItems = standby.data ?? [];
  const triageItems = triage.data ?? [];

  const standbyCount = standbyItems.length;
  const escalatedCount = triageItems.filter(item => item.analysis.status === 'escalated').length;
  const dismissedCount = triageItems.filter(item => item.analysis.status === 'dismissed').length;

  if (!isEnabled) {
    return (
      <Card className="adaf-card border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <Newspaper className="h-5 w-5" />
            News Oracle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center text-center gap-2 text-muted-foreground">
            <CircleSlash className="h-8 w-8" />
            <p>El Oráculo de Noticias está deshabilitado por feature flag.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const loading = standby.isLoading || triage.isLoading;
  const error = standby.error || triage.error;
  const errorMessage = (() => {
    if (!error) return null;
    const status = (error as any)?.status as number | undefined;
    if (status === 403) {
      return 'No tienes permisos para acceder al Oráculo de Noticias.';
    }
    if (status === 404) {
      return 'El Oráculo de Noticias está deshabilitado.';
    }
    return (error as Error).message || 'No se pudo cargar el Oráculo de Noticias.';
  })();

  return (
    <Card className="adaf-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Newspaper className="h-5 w-5" />
          News Oracle (Sim)
        </CardTitle>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => runPipeline.mutate()}
          disabled={runPipeline.isPending || loading}
        >
          {runPipeline.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Ejecutando
            </>
          ) : (
            'Ejecutar ahora'
          )}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando cola del oráculo…
          </div>
        )}

        {error && errorMessage && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" />
            {errorMessage}
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">En standby</p>
              <p className="text-2xl font-semibold">{standbyCount}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Escaladas</p>
              <p className="text-2xl font-semibold text-amber-600">{escalatedCount}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Descartadas</p>
              <p className="text-2xl font-semibold text-emerald-600">{dismissedCount}</p>
            </div>
          </div>
        )}

        {!loading && !error && standbyItems.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Cola Standby
            </h3>
            <div className="space-y-2">
              {standbyItems.slice(0, 4).map(item => (
                <div
                  key={item.analysis.id}
                  className="rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-sm leading-tight">
                        {item.event.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.event.source} · {item.event.category || 'general'}
                      </p>
                    </div>
                    <SeverityBadge risk={item.analysis.riskLevel} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(item.event.publishedAt), {
                        addSuffix: true,
                      })}
                    </div>
                    <p>
                      confidencia {item.analysis.confidenceScore?.toFixed(2) ?? '0.00'} ·
                      sent {item.analysis.sentiment?.toFixed(2) ?? '0.00'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && !error && triageItems.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Últimas decisiones
            </h3>
            <div className="space-y-2">
              {triageItems.slice(0, 4).map(item => (
                <div
                  key={`${item.analysis.id}-${item.analysis.status}`}
                  className="rounded-lg border p-3"
                >
                  <div className="flex items-center justify-between text-sm">
                    <p className="font-medium truncate pr-2">{item.event.title}</p>
                    <Badge variant="outline" className="capitalize text-xs">
                      {item.analysis.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.triage[0]?.notes || 'Sin notas de triage'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Modo sim-only · RBAC requerido · Última actualización: {formatDistanceToNow(new Date(), { addSuffix: true })}
      </CardFooter>
    </Card>
  );
}
