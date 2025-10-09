"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type HealthStatus = {
  status: string;
  timestamp: string;
  checks?: Record<string, { healthy: boolean; message?: string }>;
};

const POLL_MS = 10000;

export default function HealthMonitor() {
  const [down, setDown] = useState(false);
  const [why, setWhy] = useState<string>("");
  const [ts, setTs] = useState<string>("");
  const timer = useRef<number | null>(null);
  const lastAlertAt = useRef<number>(0);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: HealthStatus = await res.json();
      const failing = Object.entries(data.checks ?? {}).filter(([, v]) => v && v.healthy === false);
      setDown(false);
      setWhy(failing.map(([k, v]) => `${k}: ${v.message || "fail"}`).join("; "));
      setTs(data.timestamp);
    } catch (e: any) {
      const wasDown = down;
      setDown(true);
      setWhy(e?.message || "connection failed");
      setTs(new Date().toISOString());
      // Disparar alerta sólo en transición a down y con throttling de 60s
      const now = Date.now();
      if (!wasDown && now - lastAlertAt.current > 60000) {
        lastAlertAt.current = now;
        try {
          // Fire and forget
          fetch('/api/alert', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              text: `ALERTA: servidor desconectado (frontend). Motivo: ${e?.message || 'unknown'}`,
              level: 'critical',
              meta: { route: window.location.href }
            })
          }).catch(() => {});
        } catch {
          // ignore alert side-effect errors
        }
      }
    }
  }, [down]);

  useEffect(() => {
    fetchHealth();
    timer.current = window.setInterval(fetchHealth, POLL_MS);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [fetchHealth]);

  const banner = useMemo(() => {
    if (!down) return null;
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="fixed bottom-4 right-4 z-[2147483646] max-w-md shadow-2xl border-2 border-red-600 bg-gradient-to-br from-red-600 to-red-500 text-white rounded-xl p-4 animate-pulse"
      >
        <div className="font-bold text-lg mb-1">ALERTA: Servidor desconectado</div>
        <div className="text-sm opacity-90">Motivo: {why || "desconocido"}</div>
        <div className="text-xs opacity-80">Hora: {ts}</div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1 rounded-md bg-white text-red-700 font-semibold hover:bg-red-50"
          >
            Reintentar
          </button>
          <a
            href="/api/health?deep=1"
            target="_blank"
            className="px-3 py-1 rounded-md bg-red-900/40 border border-white/30 hover:bg-red-900/60"
          >
            Ver diagnóstico
          </a>
          <button
            onClick={() => {
              try {
                navigator.clipboard.writeText(`ALERTA ADAF: servidor desconectado. Motivo: ${why}`);
              } catch {
                // ignore clipboard write errors
              }
            }}
            className="px-3 py-1 rounded-md bg-yellow-300 text-black font-semibold hover:bg-yellow-200"
          >
            Copiar alerta
          </button>
        </div>
      </div>
    );
  }, [down, why, ts]);

  return banner;
}
