// Dashboard simplificado para debugging
import { Badge } from '@/components/ui/badge';
import { Activity } from 'lucide-react';
import Link from 'next/link';

async function getJSON(path: string) {
  try {
    const r = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${path}`,
      { cache: 'no-store' }
    );
    if (!r.ok) return null;
    return r.json();
  } catch {
    return null;
  }
}

export default async function MainDashboardPage() {
  const [nav, alerts7d] = await Promise.all([
    getJSON('/api/read/kpi/nav'),
    getJSON('/api/read/kpi/alerts7d'),
  ]);
  const navUsd = nav?.navUsd ?? 1000000;
  const alertsCount = Array.isArray(alerts7d)
    ? alerts7d.reduce(
        (s: number, x: { d?: string; c?: number }) => s + Number(x.c || 0),
        0
      )
    : 3;

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Navigation */}
      <header className="border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/markets" className="flex items-center gap-2">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  🎯 ADAF Dashboard Pro
                </h1>
              </Link>
            </div>
            <Badge variant="outline" className="text-green-600">
              <Activity className="w-4 h-4 mr-1" />
              Sistema Activo
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6 space-y-8">
        <h2>Dashboard Simple - Sin Componentes Complejos</h2>
        <p>NAV: ${navUsd?.toLocaleString()}</p>
        <p>Alertas: {alertsCount}</p>
      </main>
    </div>
  );
}
