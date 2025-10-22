'use client';
import React, { createContext, useContext, useState, useCallback } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import {
  normalizeLayoutItems,
  readLayoutItems,
  writeLayoutItems,
} from '@/lib/layout/persistence';

export interface DashboardItem {
  id: string;
  component: string;
  span: number; // Grid column span (1-12)
  order: number;
}

interface DashboardLayoutContextType {
  items: DashboardItem[];
  moveItem: (_activeId: string, _overId: string) => void;
  reorderItems: (_newItems: DashboardItem[]) => void;
  resetLayout: () => void;
  isEditMode: boolean;
  setEditMode: (_enabled: boolean) => void;
}

const DashboardLayoutContext = createContext<
  DashboardLayoutContextType | undefined
>(undefined);

// Default dashboard layout
const DEFAULT_LAYOUT: DashboardItem[] = [
  // Fila 1: KPIs Principales (12 cols)
  { id: 'kpi-strip', component: 'KpiStrip', span: 12, order: 0 },

  // Fila 2: Resumen de Mercados - Flujos ETF + Comparativo
  { id: 'etf-autoswitch', component: 'EtfAutoswitchCard', span: 8, order: 1 },
  { id: 'etf-compare-mini', component: 'EtfCompareMini', span: 4, order: 2 },

  // Fila 3: On-chain & TVL
  {
    id: 'funding-snapshot',
    component: 'FundingSnapshotCard',
    span: 6,
    order: 3,
  },
  { id: 'tvl-heatmap', component: 'TvlHeatmapCard', span: 6, order: 4 },

  // Fila 4: Noticias & Regulatorio + Salud DQP
  { id: 'news-reg-panel', component: 'NewsRegPanel', span: 8, order: 5 },
  { id: 'dqp-health', component: 'DqpHealthCard', span: 4, order: 6 },

  // Fila 5: Alertas + OP-X + Guardrails
  { id: 'alerts-live', component: 'AlertsLiveCard', span: 4, order: 7 },
  { id: 'opx-top-scores', component: 'OpxTopScores', span: 4, order: 8 },
  { id: 'guardrails', component: 'GuardrailsCard', span: 4, order: 9 },

  // Research Panel (span completo)
  { id: 'research-panel', component: 'ResearchPanel', span: 12, order: 10 },

  // Simulation modules (span 6)
  { id: 'blockspace-ops', component: 'BlockspaceOpsCard', span: 6, order: 11 },
  { id: 'vaults-lav', component: 'VaultsLavCard', span: 6, order: 12 },
  { id: 'alpha-factory', component: 'AlphaFactoryCard', span: 6, order: 13 },
  { id: 'meta-allocator', component: 'MetaAllocatorCard', span: 6, order: 14 },
  { id: 'volpro-card', component: 'VolProCard', span: 6, order: 15 },
  { id: 'event-alpha', component: 'EventAlphaCard', span: 6, order: 16 },
  { id: 'mm-selective', component: 'SelectiveMMCard', span: 6, order: 17 },
  { id: 'tca-insights', component: 'TcaInsightsCard', span: 6, order: 18 },
  { id: 'cosmos-executor', component: 'CosmosExecutorCard', span: 6, order: 19 },
  { id: 'liquidity-backstop', component: 'LiquidityBackstopCard', span: 6, order: 20 },
];

export function DashboardLayoutProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<DashboardItem[]>(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_LAYOUT;
    }
    return readLayoutItems('dashboard-layout', DEFAULT_LAYOUT);
  });

  const [isEditMode, setIsEditMode] = useState(false);

  const saveLayout = useCallback((newItems: DashboardItem[]) => {
    writeLayoutItems('dashboard-layout', newItems);
  }, []);

  const moveItem = useCallback(
    (activeId: string, overId: string) => {
      setItems(items => {
        const current = normalizeLayoutItems(DEFAULT_LAYOUT, items);
        const oldIndex = current.findIndex(item => item.id === activeId);
        const newIndex = current.findIndex(item => item.id === overId);

        if (oldIndex !== -1 && newIndex !== -1) {
          const reorderedItems = arrayMove(current, oldIndex, newIndex).map(
            (item, index) => ({
              ...item,
              order: index,
            })
          );
          saveLayout(reorderedItems);
          return reorderedItems;
        }

        return current;
      });
    },
    [saveLayout]
  );

  const reorderItems = useCallback(
    (newItems: DashboardItem[]) => {
      const normalized = normalizeLayoutItems(DEFAULT_LAYOUT, newItems);
      const reorderedItems = normalized.map((item, index) => ({
        ...item,
        order: index,
      }));
      setItems(reorderedItems);
      saveLayout(reorderedItems);
    },
    [saveLayout]
  );

  const resetLayout = useCallback(() => {
    const baseline = DEFAULT_LAYOUT.map((item, index) => ({ ...item, order: index }));
    setItems(baseline);
    saveLayout(baseline);
  }, [saveLayout]);

  const setEditMode = useCallback((enabled: boolean) => {
    setIsEditMode(enabled);
  }, []);

  return (
    <DashboardLayoutContext.Provider
      value={{
        items,
        moveItem,
        reorderItems,
        resetLayout,
        isEditMode,
        setEditMode,
      }}
    >
      {children}
    </DashboardLayoutContext.Provider>
  );
}

export function useDashboardLayout() {
  const context = useContext(DashboardLayoutContext);
  if (context === undefined) {
    throw new Error(
      'useDashboardLayout must be used within a DashboardLayoutProvider'
    );
  }
  return context;
}
