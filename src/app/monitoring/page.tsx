"use client";
import { useEffect, useState } from 'react'

type Check = { healthy: boolean; message?: string; error?: string };
type Health = { status: string; timestamp: string; checks?: Record<string, Check> };

export default function MonitoringPage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(deep = false, forceReal = false) {
    setLoading(true);
    setError(null);
    try {
      const url = deep ? `/api/health?deep=1&timeout=2500${forceReal ? '&force=real' : ''}` : '/api/health';
      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json();
      setHealth(data);
      if (!res.ok) setError('Alguna verificación falló');
    } catch (e: any) {
      setError(e?.message || 'Error cargando estado');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(false); }, []);

  const checks = health?.checks || {};
  const items = Object.entries(checks);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Monitoring</h1>
        <p className="text-gray-600">Estado del sistema y diagnósticos rápidos.</p>
      </div>

      <div className="flex gap-2">
        <button onClick={() => load(false)} className="px-3 py-2 rounded-md bg-blue-600 text-white">Refrescar</button>
  <button onClick={() => load(true)} className="px-3 py-2 rounded-md bg-amber-600 text-white">Chequeo profundo</button>
  <button onClick={() => load(true, true)} className="px-3 py-2 rounded-md bg-red-600 text-white">Profundo (forzar real)</button>
        <a href="/api/health" target="_blank" className="px-3 py-2 rounded-md border">Ver JSON</a>
  <a href="/api/health?deep=1" target="_blank" className="px-3 py-2 rounded-md border">Ver JSON (deep)</a>
  <a href="/api/health?deep=1&force=real" target="_blank" className="px-3 py-2 rounded-md border">Ver JSON (deep, real)</a>
      </div>

      {loading && <div className="text-gray-500">Cargando…</div>}
      {!loading && error && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-800">{error}</div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.length === 0 && (
            <div className="p-4 rounded-md border bg-white">No hay checks en modo shallow. Usa “Chequeo profundo”.</div>
          )}
          {items.map(([name, c]) => (
            <div key={name} className={`p-4 rounded-md border bg-white ${c.healthy ? 'border-green-300' : 'border-red-300'}`}>
              <div className="font-semibold flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${c.healthy ? 'bg-green-500' : 'bg-red-500'}`} />
                {name}
              </div>
              <div className="text-sm text-gray-700 mt-2">{c.message || (c.healthy ? 'OK' : 'Fallo')}</div>
              {c.error && <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto">{c.error}</pre>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
