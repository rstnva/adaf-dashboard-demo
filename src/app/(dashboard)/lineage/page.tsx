"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { SkeletonPatterns } from "@/components/common/SkeletonBlock";
import { ErrorState } from "@/components/common/ErrorState";
import { ArrowRight, Database, Search, ShieldCheck } from "lucide-react";

export default function LineagePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lineage, setLineage] = useState<any>(null);

  useEffect(() => {
    fetch("/api/read/lineage/trace?signal=dashboard")
      .then((res) => {
        if (!res.ok) throw new Error("No lineage data found");
        return res.json();
      })
      .then((data) => {
        setLineage(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6 p-6">
      <nav className="text-sm text-muted-foreground mb-2">
        <span className="hover:text-foreground">Dashboard</span>
        <span className="mx-2">›</span>
        <span>Lineage</span>
      </nav>
      <Card className="adaf-card">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Database className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold">Lineaje de Datos y Procedencia</h2>
            <Badge variant="outline" className="ml-2">Fortune 500 Ready</Badge>
          </div>
          <p className="text-muted-foreground mb-6 max-w-2xl">
            Visualiza el flujo, origen y transformación de los datos críticos del sistema. Trazabilidad completa, auditoría y cumplimiento institucional.
          </p>
          {loading && <SkeletonPatterns.Table />}
          {error && <>
            <ErrorState title="No se pudo cargar el lineaje" />
            <div className="text-xs text-muted-foreground mt-2">{error}</div>
          </>}
          {lineage && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
                <div className="flex flex-col items-center">
                  <ShieldCheck className="h-8 w-8 text-green-600 mb-2" />
                  <span className="font-semibold">Fuente de Datos</span>
                  <span className="text-xs text-muted-foreground">Origen institucional</span>
                </div>
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
                <div className="flex flex-col items-center">
                  <Search className="h-8 w-8 text-blue-600 mb-2" />
                  <span className="font-semibold">Procesamiento</span>
                  <span className="text-xs text-muted-foreground">Transformaciones, reglas y validaciones</span>
                </div>
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
                <div className="flex flex-col items-center">
                  <Database className="h-8 w-8 text-amber-600 mb-2" />
                  <span className="font-semibold">Destino</span>
                  <span className="text-xs text-muted-foreground">Paneles, reportes y APIs</span>
                </div>
              </div>
              <div className="mt-8">
                <h3 className="font-semibold mb-2">Detalle de Lineaje</h3>
                <pre className="bg-muted p-4 rounded text-xs overflow-x-auto max-h-96">
                  {JSON.stringify(lineage, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
