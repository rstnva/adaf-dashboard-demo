'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type Guide = {
  title: string;
  what: string;
  objective: string;
  steps: string[];
  concepts: string[];
  success: string;
  tags?: string[];
  cta?: { label: string; href: string };
};

function AnimatedSection({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div className={cn('overflow-hidden', className)}>
      <div
        className="quick-help-animate"
        style={{ animationDelay: `${delay}ms` }}
      >
        {children}
      </div>
    </div>
  );
}

// Lightweight registry: map by route prefix
const guides: Array<{ prefix: string; guide: Guide }> = [
  {
    prefix: '/monitoring',
    guide: {
      title: 'Monitoring',
      what: 'Salud del sistema, checks profundos y diagnóstico operativo.',
      objective: 'Detectar problemas en minutos y seguir el runbook.',
      steps: [
        'Ejecuta health deep (DB/Redis/externos)',
        'Revisa errores y latencias',
        'Sigue el runbook según el tipo de alerta',
      ],
      concepts: ['Liveness/Readiness', 'Latency p95', 'Errores 5xx', 'SLO'],
      success:
        'Identificaste la causa y accionaste (escalado/reintento/runbook).',
      cta: { label: 'Aprende más (Ops)', href: '/academy?topic=ops' },
    },
  },
  {
    prefix: '/dashboard',
    guide: {
      title: 'Panel principal',
      what: 'Vista general: salud, señales clave y accesos rápidos a módulos.',
      objective: 'En 60s, entender el estado y decidir la siguiente acción.',
      steps: [
        'Revisa KPIs y estado de salud',
        'Explora tarjetas: alertas, TVL, DQP, guardrails',
        'Si hay anomalías, abre Monitoring o Research',
      ],
      concepts: ['KPI', 'Señales/Alertas', 'Guardrails', 'Salud del sistema'],
      success:
        'Puedes explicar el estado y abrir el panel correcto para profundizar.',
      tags: ['overview', 'kpi', 'acciones'],
      cta: { label: 'Aprende más (Overview)', href: '/academy?topic=overview' },
    },
  },
  {
    prefix: '/opx',
    guide: {
      title: 'Guardrails & Ops (OpX)',
      what: 'Reglas operativas, bloqueos y eventos automáticos.',
      objective: 'Entender por qué se bloqueó algo y cómo actuar.',
      steps: [
        'Identifica la regla activada',
        'Revisa contexto y cooldown',
        'Levanta bloqueo o ajusta parámetros si procede',
      ],
      concepts: ['Cooldown', 'Regla', 'Severidad', 'Evento'],
      success: 'Desbloqueo/ajuste documentado y en control.',
      cta: { label: 'Aprende más (OpX)', href: '/academy?topic=opx' },
    },
  },
  {
    prefix: '/research',
    guide: {
      title: 'Research',
      what: 'Herramientas para analizar estrategias, señales y comparativas.',
      objective: 'Comparar estrategias y entender su desempeño.',
      steps: [
        'Elige una estrategia o preset',
        'Compara curvas de equity y métricas',
        'Identifica diferencias y decisiones a tomar',
      ],
      concepts: ['Backtest', 'Equity curve', 'Presets', 'Comparativa'],
      success: 'Comparaste 2+ estrategias y decidiste cuál profundizar.',
      cta: { label: 'Aprende más (Research)', href: '/academy?topic=research' },
    },
  },
  {
    prefix: '/etf-flows',
    guide: {
      title: 'ETF Flows',
      what: 'Flujos de entrada/salida en ETFs (BTC/ETH) y su impacto.',
      objective:
        'Detectar cambios de régimen por flujos y su efecto en precio.',
      steps: [
        'Observa inflows/outflows por ventana (1d/5d/MTD)',
        'Relaciona con WSPS/semáforo y eventos',
        'Toma nota de sesgos para el plan de trading',
      ],
      concepts: ['Inflow/Outflow', 'MTD/5D', 'WSPS', 'Sesgo direccional'],
      success: 'Resumes si flujos refuerzan o contradicen el sesgo.',
      cta: { label: 'Aprende más (ETF Flows)', href: '/academy?topic=etf' },
    },
  },
  {
    prefix: '/derivatives',
    guide: {
      title: 'Derivados',
      what: 'Panel de opciones, gamma y métricas de derivados.',
      objective: 'Evaluar presión gamma y riesgos de reversión.',
      steps: [
        'Revisa gamma exposure y strikes clave',
        'Busca zonas de pin/riesgo',
        'Ajusta expectativas de volatilidad',
      ],
      concepts: ['Gamma', 'Pin risk', 'Volatilidad', 'Strikes'],
      success:
        'Identificaste zonas probables de atracción/repulsión de precio.',
      cta: {
        label: 'Aprende más (Derivados)',
        href: '/academy?topic=derivatives',
      },
    },
  },
  {
    prefix: '/markets',
    guide: {
      title: 'Mercados',
      what: 'Estado de mercado: índices, FX, rates y correlaciones.',
      objective: 'Entender el contexto macro que afecta cripto.',
      steps: [
        'Mira DXY, yields y VIX',
        'Correlación con BTC/ETH',
        'Anota riesgos macro inmediatos',
      ],
      concepts: ['DXY', 'Yields', 'VIX', 'Correlación'],
      success: 'Puedes explicar el viento macro a favor/en contra.',
      cta: { label: 'Aprende más (Macro)', href: '/academy?topic=macro' },
    },
  },
  {
    prefix: '/news',
    guide: {
      title: 'Noticias',
      what: 'Stream de noticias deduplicadas y relevantes.',
      objective: 'Detectar noticias catalizadoras y su impacto.',
      steps: [
        'Escanea titulares y severidad',
        'Abre las de severidad alta',
        'Relaciona con flujos y derivados',
      ],
      concepts: ['Catalizador', 'Severidad', 'Deduplicación'],
      success: 'Identificaste 1-2 noticias que justifican acciones.',
      cta: { label: 'Aprende más (Noticias)', href: '/academy?topic=news' },
    },
  },
  {
    prefix: '/onchain',
    guide: {
      title: 'On-chain / TVL',
      what: 'Datos on-chain y TVL por protocolo/cadena.',
      objective: 'Ver rotación de liquidez y riesgos concentrados.',
      steps: [
        'Observa TVL cambios 24h/MTD',
        'Detecta salidas fuertes por protocolo',
        'Cruza con eventos y derivados',
      ],
      concepts: ['TVL', 'Rotación', 'Riesgo protocolo'],
      success: 'Puedes señalar protocolos en alerta o oportunidad.',
      cta: { label: 'Aprende más (On-chain)', href: '/academy?topic=onchain' },
    },
  },
  {
    prefix: '/defi/opportunities',
    guide: {
      title: 'DeFi Yield Intelligence',
      what: 'Mapa en tiempo real de rendimientos, TVL y riesgos en protocolos DeFi clave.',
      objective: 'Detectar rendimientos sostenibles y rotaciones de liquidez para actuar antes que el mercado.',
      steps: [
        'Filtra por chain, protocolo o stablecoins según tu tesis',
        'Ordena por APY y revisa la composición base vs. rewards',
        'Cruza TVL y cambios de APY para validar sostenibilidad',
      ],
      concepts: ['APY', 'TVL', 'Risk score', 'Stablecoins', 'Restaking'],
      success:
        'Identificaste 1-2 oportunidades con APY atractivo, TVL saludable y riesgo alineado al mandato.',
      tags: ['defi', 'yield', 'real-yield'],
      cta: { label: 'Ver research DeFi', href: '/research?topic=defi' },
    },
  },
  {
    prefix: '/equities',
    guide: {
      title: 'Equities AI Sleeve',
      what: 'Motor multi-factor con recomendaciones accionables, flujos ETF y control institucional.',
      objective: 'Seleccionar el plan de rebalance con base en señales cuantitativas y riesgo controlado.',
      steps: [
        'Revisa el snapshot del sleeve y los límites de riesgo',
        'Evalúa señales, fundamentales, flujos ETF y ownership para validar tesis',
        'Ejecuta un backtest rápido y documenta la decisión en Control',
      ],
      concepts: ['Multi-factor', 'ETF flows', 'Institutional ownership', 'Backtest'],
      success: 'Generaste un paquete validado con plan de ejecución y evidencia cuantitativa.',
      cta: { label: 'Profundizar en Research', href: '/research?topic=equities' },
    },
  },
  {
    prefix: '/wallstreet',
    guide: {
      title: 'Wall Street Pulse (WSP)',
      what: 'Score WSPS, eventos y auto-react.',
      objective: 'Usar WSPS como brújula de sesgo institucional.',
      steps: [
        'Consulta WSPS actual y su tendencia',
        'Mira eventos generados y cooldowns',
        'Decide si refuerza/contradice tu plan',
      ],
      concepts: ['WSPS', 'Eventos', 'Cooldown'],
      success: 'Puedes justificar tu sesgo usando WSPS y eventos.',
      cta: { label: 'Aprende más (WSP)', href: '/academy?topic=wsp' },
    },
  },
  {
    prefix: '/security',
    guide: {
      title: 'Seguridad',
      what: 'Panel de CSP, claves y controles.',
      objective: 'Verificar postura de seguridad y acciones inmediatas.',
      steps: [
        'Revisa advertencias CSP',
        'Valida rotación de claves',
        'Prueba alertas webhooks si procede',
      ],
      concepts: ['CSP', 'Rotación', 'Webhooks'],
      success: 'Checklist básico de seguridad en verde.',
      cta: {
        label: 'Aprende más (Seguridad)',
        href: '/academy?topic=security',
      },
    },
  },
  {
    prefix: '/reports',
    guide: {
      title: 'Reportes (Módulo F)',
      what: 'KPIs institucionales y generación de PDFs.',
      objective: 'Preparar un paquete de reporte para revisión.',
      steps: [
        'Selecciona periodo y KPIs',
        'Genera el borrador PDF',
        'Valida cifras y distribuye',
      ],
      concepts: ['IRR', 'TVPI', 'NAV', 'Proof of Reserves'],
      success: 'Reporte generado y validado sin discrepancias.',
      cta: { label: 'Aprende más (Módulo F)', href: '/academy?topic=module-f' },
    },
  },
  {
    prefix: '/academy',
    guide: {
      title: 'Academy',
      what: 'Lecciones, quizzes y seguimiento de progreso.',
      objective: 'Aprender conceptos y validar comprensión.',
      steps: [
        'Abre una lección',
        'Completa el quiz',
        'Revisa tu progreso y repite si es necesario',
      ],
      concepts: ['Lección', 'Quiz', 'Progreso'],
      success: 'Completaste una unidad y entendiste los conceptos.',
      cta: { label: 'Ir a Academy', href: '/academy' },
    },
  },
  {
    prefix: '/dqp',
    guide: {
      title: 'Data Quality (DQP)',
      what: 'Estado de frescura y calidad de datos.',
      objective: 'Asegurar datos actualizados para decisiones.',
      steps: [
        'Revisa freshness y atrasos',
        'Identifica fuentes problemáticas',
        'Escala o reingesta según runbook',
      ],
      concepts: ['Freshness', 'Lag', 'Reproceso'],
      success: 'Todos los feeds críticos dentro de SLO.',
      cta: { label: 'Abrir Monitoring', href: '/monitoring' },
    },
  },
  {
    prefix: '/pnl',
    guide: {
      title: 'PnL Analytics',
      what: 'Rendimiento por periodo y análisis de curvas.',
      objective: 'Entender drivers de rendimiento y drawdowns.',
      steps: [
        'Selecciona rango',
        'Observa drawdowns y recuperación',
        'Relaciona con eventos/estrategias',
      ],
      concepts: ['PnL', 'Drawdown', 'Recuperación'],
      success: 'Puedes explicar el PnL reciente y sus causas.',
      cta: { label: 'Aprende más (PnL)', href: '/academy?topic=pnl' },
    },
  },
];

function getGuide(path: string): Guide | null {
  const item = guides.find(g => path.startsWith(g.prefix));
  return item ? item.guide : null;
}

export function PageGuide({ className }: { className?: string }) {
  const pathname = usePathname();
  const guide = getGuide(pathname || '/');
  const [open, setOpen] = React.useState<boolean>(true);
  const [always, setAlways] = React.useState<boolean>(true);
  const storageKey = React.useMemo(() => `pageguide:${pathname}`, [pathname]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    // Preferencia global: mostrar guías siempre (por defecto activado)
    const globalPref = window.localStorage.getItem('pageguide:always');
    if (globalPref === null) {
      window.localStorage.setItem('pageguide:always', '1');
      setAlways(true);
    } else {
      setAlways(globalPref !== '0');
    }
    // Estado por ruta solo aplica si no está la preferencia global
    const saved = window.localStorage.getItem(storageKey);
    if (!(globalPref !== null && globalPref !== '0')) {
      if (saved === 'open') setOpen(true);
      if (saved === 'closed') setOpen(false);
    } else {
      setOpen(true);
    }
  }, [storageKey]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!always) {
      window.localStorage.setItem(storageKey, open ? 'open' : 'closed');
    }
  }, [open, storageKey, always]);

  // Listen for global preference changes triggered from TopBar
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = () => {
      try {
        const v = window.localStorage.getItem('pageguide:always');
        const enabled = v === null ? true : v !== '0' && v !== 'false';
        setAlways(enabled);
        setOpen(enabled ? true : open);
      } catch {
        // ignore
      }
    };
    window.addEventListener(
      'pageguide:always-changed',
      handler as EventListener
    );
    return () =>
      window.removeEventListener(
        'pageguide:always-changed',
        handler as EventListener
      );
  }, [open]);

  if (!guide) return null;

  return (
    <>
      <div
        className={cn(
          'mb-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900',
          className
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-200 text-sm font-bold text-amber-900">
              ?
            </span>
            <h3 className="text-sm font-semibold">
              Guía rápida — {guide.title}
            </h3>
          </div>
          {!always ? (
            <button
              onClick={() => setOpen(v => !v)}
              className="rounded-md border border-amber-300 bg-white px-2 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100"
              aria-expanded={open}
            >
              {open ? 'Ocultar' : 'Mostrar'}
            </button>
          ) : (
            <span className="text-xs text-amber-700">
              Mostrando siempre (preferencia global)
            </span>
          )}
        </div>
        {open && (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <AnimatedSection key={`${guide.title}-what`} delay={0}>
                <p className="text-sm">
                  <span className="font-semibold">¿Qué es?</span> {guide.what}
                </p>
              </AnimatedSection>
              <AnimatedSection key={`${guide.title}-objective`} delay={120}>
                <p className="text-sm">
                  <span className="font-semibold">Objetivo:</span>{' '}
                  {guide.objective}
                </p>
              </AnimatedSection>
              <AnimatedSection key={`${guide.title}-steps`} delay={240}>
                <div>
                  <p className="text-sm font-semibold">Pasos rápidos</p>
                  <ol className="ml-4 list-decimal text-sm">
                    {guide.steps.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ol>
                </div>
              </AnimatedSection>
            </div>
            <div className="space-y-2">
              <AnimatedSection key={`${guide.title}-concepts`} delay={280}>
                <div>
                  <p className="text-sm font-semibold">Conceptos clave</p>
                  <ul className="ml-4 list-disc text-sm">
                    {guide.concepts.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              </AnimatedSection>
              <AnimatedSection key={`${guide.title}-success`} delay={360}>
                <p className="text-sm">
                  <span className="font-semibold">Éxito =</span> {guide.success}
                </p>
              </AnimatedSection>
            </div>
            <AnimatedSection
              key={`${guide.title}-cta`}
              delay={420}
              className="col-span-full mt-1"
            >
              <div className="flex flex-wrap items-center gap-2">
                {guide.cta && (
                  <Link
                    href={guide.cta.href}
                    className="inline-flex items-center rounded-md border border-amber-300 bg-white px-3 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100"
                  >
                    {guide.cta.label}
                  </Link>
                )}
              </div>
            </AnimatedSection>
          </div>
        )}
      </div>
      <style jsx>{`
        .quick-help-animate {
          opacity: 0;
          transform: translateY(20px);
          animation: quick-help-slide 620ms cubic-bezier(0.19, 1, 0.22, 1)
            forwards;
        }

        @keyframes quick-help-slide {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          60% {
            opacity: 1;
            transform: translateY(-2px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .quick-help-animate {
            animation: none;
            opacity: 1;
            transform: none;
          }
        }
      `}</style>
    </>
  );
}
