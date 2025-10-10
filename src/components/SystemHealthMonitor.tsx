"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const POLL_MS = 10000;

export default function SystemHealthMonitor() {
  const [isDown, setIsDown] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [timestamp, setTimestamp] = useState("");
  const timer = useRef<number | null>(null);
  const lastAlertAt = useRef<number>(0);

  const checkHealth = useCallback(async () => {
    try {
      const response = await fetch("/api/health", { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const failingChecks = Object.entries(data.checks ?? {}).filter(([, v]) => (v as any)?.healthy === false);
      setIsDown(false);
      setErrorMessage(failingChecks.map(([k, v]) => `${k}: ${(v as any)?.message || "fail"}`).join("; "));
      setTimestamp(data.timestamp);
    } catch (error: any) {
      const wasDown = isDown;
      setIsDown(true);
      setErrorMessage(error?.message || "connection failed");
      setTimestamp(new Date().toISOString());
      // Fire alert only on transition and with throttling
      const now = Date.now();
      if (!wasDown && now - lastAlertAt.current > 60000) {
        lastAlertAt.current = now;
        try {
          fetch('/api/alert', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              text: `ALERTA: servidor desconectado (frontend). Motivo: ${error?.message || 'unknown'}`,
              level: 'critical',
              meta: { route: window.location.href }
            })
          }).catch(() => {});
        } catch {
          // ignore alert errors
        }
      }
    }
  }, [isDown]);

  useEffect(() => {
    checkHealth();
    timer.current = window.setInterval(checkHealth, POLL_MS);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [checkHealth]);

  const alertBanner = useMemo(() => {
    if (!isDown) return null;
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="fixed bottom-4 right-4 z-[2147483646] max-w-md shadow-2xl border-2 border-red-600 bg-gradient-to-br from-red-600 to-red-500 text-white rounded-xl p-4 animate-pulse"
      >
        <div className="font-bold text-lg mb-1">ALERTA: Servidor desconectado</div>
        <div className="text-sm opacity-90">Motivo: {errorMessage || "desconocido"}</div>
        <div className="text-xs opacity-80">Hora: {timestamp}</div>
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
                navigator.clipboard.writeText(`ALERTA ADAF: servidor desconectado. Motivo: ${errorMessage}`);
              } catch {
                // ignore clipboard errors
              }
            }}
            className="px-3 py-1 rounded-md bg-yellow-300 text-black font-semibold hover:bg-yellow-200"
          >
            Copiar alerta
          </button>
        </div>
      </div>
    );
  }, [isDown, errorMessage, timestamp]);

  return alertBanner;
}