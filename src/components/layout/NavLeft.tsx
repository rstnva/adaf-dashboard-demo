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
    <nav className={cn(
      "flex h-screen flex-col border-r bg-white transition-all duration-300",
      sidebarCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600" />
            <span className="font-bold text-xl">ADAF</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="h-8 w-8 p-0"
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
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "w-full justify-start transition-colors",
                    sidebarCollapsed ? "px-2" : "px-3",
                    isActive && "bg-blue-50 text-blue-700 hover:bg-blue-100",
                    isExternal && "bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 text-purple-700"
                  )}
                >
                  <Icon className={cn("h-4 w-4 flex-shrink-0", sidebarCollapsed ? "" : "mr-3")} />
                  {!sidebarCollapsed && (
                    <div className="flex flex-col items-start">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{item.label}</span>
                        {isExternal && <ExternalLink className="h-3 w-3" />}
                      </div>
                      {item.description && (
                        <span className="text-xs text-gray-500 font-normal">
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