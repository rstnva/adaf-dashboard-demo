'use client';

import React from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui';
import {
  Home,
  TrendingUp,
  Link as LinkIcon,
  BarChart3,
  Newspaper,
  Search,
  Target,
  FileText,
  Shield,
  GitBranch,
  GraduationCap,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bot,
  ExternalLink
} from 'lucide-react';

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/',
    icon: Home,
    label: 'Inicio',
    description: 'Resumen del dashboard'
  },
  {
    href: '/markets',
    icon: TrendingUp,
    label: 'Mercados',
    description: 'Flujos ETF, funding, comparativos'
  },
  {
    href: '/onchain',
    icon: LinkIcon,
    label: 'On-Chain',
    description: 'TVL, flujos stablecoin, real yield'
  },
  {
    href: '/derivatives',
    icon: BarChart3,
    label: 'Derivados',
    description: 'Funding rates, exposición gamma'
  },
  {
    href: '/news',
    icon: Newspaper,
    label: 'Noticias',
    description: 'Sentinel de noticias, vigilancia regulatoria'
  },
  {
    href: '/research',
    icon: Search,
    label: 'Research',
    description: 'Backtesting, herramientas de análisis'
  },
  {
    href: '/opx',
    icon: Target,
    label: 'OP-X',
    description: 'Oportunidades de estrategia'
  },
  {
    href: '/reports',
    icon: FileText,
    label: 'Reportes',
    description: 'Reportes generados y entrega'
  },
  {
    href: '/dqp',
    icon: Shield,
    label: 'DQP',
    description: 'Calidad de datos y gobernanza'
  },
  {
    href: '/lineage',
    icon: GitBranch,
    label: 'Lineage',
    description: 'Linaje de datos y procedencia'
  },
  {
    href: '/academy',
    icon: GraduationCap,
    label: 'Academia',
    description: 'Bootcamp de aprendizaje'
  },
  {
    href: '/control',
    icon: Settings,
    label: 'Control',
    description: 'Límites, reglas, auditoría'
  },
  {
    href: '/monitoring',
    icon: Shield,
    label: 'Monitoring',
    description: 'Estado y diagnósticos rápidos'
  },
  {
    href: 'http://localhost:3005',
    icon: Bot,
    label: 'LAV-ADAF',
    description: 'Sistema de Agentes Cuantitativos'
  }
];

export function NavLeft() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <nav
      className={cn(
        "flex h-screen flex-col border-r border-amber-300/20 bg-black/60 backdrop-blur-2xl text-amber-100/75 shadow-[0_30px_90px_-40px_rgba(15,23,42,0.95)] transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-500/70 via-yellow-400/70 to-amber-300/70 shadow-[0_12px_35px_rgba(250,204,21,0.45)]" />
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-[0.4em] text-amber-200/60">ADAF</span>
              <span className="text-lg font-semibold text-amber-100">Vision Hub</span>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="h-8 w-8 rounded-full bg-white/5 p-0 text-slate-300/80 hover:bg-white/15 hover:text-white"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto py-4">
        <div className="space-y-1 px-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isExternal = item.href.startsWith('http');
            const isActive = !isExternal && (item.href === '/'
              ? pathname === '/'
              : pathname === item.href || pathname.startsWith(item.href + '/'));

            const linkProps = isExternal 
              ? { href: item.href, target: '_blank', rel: 'noopener noreferrer' }
              : { href: item.href };

            return (
              <Link key={item.href} {...linkProps}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "group w-full justify-start rounded-2xl border border-transparent bg-black/40 px-3 py-2 text-sm font-medium text-amber-200/70 transition-all duration-200 hover:border-amber-200/40 hover:bg-amber-500/10 hover:text-amber-100",
                    sidebarCollapsed ? "px-2" : "px-3",
                    isActive && "border-amber-300/45 bg-gradient-to-r from-amber-500/30 via-amber-400/25 to-yellow-300/30 text-amber-100 shadow-[0_12px_40px_rgba(250,204,21,0.35)]",
                    isExternal && "bg-gradient-to-r from-amber-500/20 to-yellow-400/15 text-amber-100 hover:from-amber-500/35 hover:to-yellow-300/20"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-105",
                      sidebarCollapsed ? "" : "mr-3"
                    )}
                  />
                  {!sidebarCollapsed && (
                    <div className="flex flex-col items-start">
                      <div className="flex items-center gap-1">
                        <span className="font-medium tracking-tight">{item.label}</span>
                        {isExternal && <ExternalLink className="h-3 w-3" />}
                      </div>
                      {item.description && (
                        <span className="text-xs font-normal text-amber-200/60">
                          {item.description}
                        </span>
                      )}
                    </div>
                  )}
                </Button>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      {!sidebarCollapsed && (
        <div className="border-t p-4">
          <div className="text-xs text-gray-500">
            <div className="font-medium">ADAF Dashboard Pro</div>
            <div>v2.1.0 • 2025</div>
          </div>
        </div>
      )}
    </nav>
  );
}
