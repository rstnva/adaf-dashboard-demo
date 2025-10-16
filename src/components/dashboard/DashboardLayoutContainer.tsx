'use client';

import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useDashboardLayout } from '@/contexts/DashboardLayoutContext';
import { DraggableCard } from './DraggableCard';

// Import all dashboard components
import { KpiStrip } from './KpiStrip';
import EtfAutoswitchCard from './EtfAutoswitchCard';
import { EtfCompareMini } from './EtfCompareMini';
import { FundingSnapshotCard } from './FundingSnapshotCard';
import { TvlHeatmapCard } from './TvlHeatmapCard';
import { NewsRegPanel } from './NewsRegPanel';
import { DqpHealthCard } from './DqpHealthCard';
import { AlertsLiveCard } from './AlertsLiveCard';
import { OpxTopScores } from './OpxTopScores';
import { GuardrailsCard } from './GuardrailsCard';
import { ResearchPanel } from '@/components/research/ResearchPanel';
import { BlockspaceOpsCard } from './sim/BlockspaceOpsCard';
import { VaultsLavCard } from './sim/VaultsLavCard';
import { AlphaFactoryCard } from './sim/AlphaFactoryCard';
import { MetaAllocatorCard } from './sim/MetaAllocatorCard';
import { VolProCard } from './sim/VolProCard';
import { EventAlphaCard } from './sim/EventAlphaCard';
import { SelectiveMMCard } from './sim/SelectiveMMCard';
import { TcaInsightsCard } from './sim/TcaInsightsCard';
import { CosmosExecutorCard } from './sim/CosmosExecutorCard';
import { LiquidityBackstopCard } from './sim/LiquidityBackstopCard';

// Component mapping
const COMPONENT_MAP = {
  'KpiStrip': KpiStrip,
  'EtfAutoswitchCard': EtfAutoswitchCard,
  'EtfCompareMini': EtfCompareMini,
  'FundingSnapshotCard': FundingSnapshotCard,
  'TvlHeatmapCard': TvlHeatmapCard,
  'NewsRegPanel': NewsRegPanel,
  'DqpHealthCard': DqpHealthCard,
  'AlertsLiveCard': AlertsLiveCard,
  'OpxTopScores': OpxTopScores,
  'GuardrailsCard': GuardrailsCard,
  'ResearchPanel': ResearchPanel,
  'BlockspaceOpsCard': BlockspaceOpsCard,
  'VaultsLavCard': VaultsLavCard,
  'AlphaFactoryCard': AlphaFactoryCard,
  'MetaAllocatorCard': MetaAllocatorCard,
  'VolProCard': VolProCard,
  'EventAlphaCard': EventAlphaCard,
  'SelectiveMMCard': SelectiveMMCard,
  'TcaInsightsCard': TcaInsightsCard,
  'CosmosExecutorCard': CosmosExecutorCard,
  'LiquidityBackstopCard': LiquidityBackstopCard,
};

export function DashboardLayoutContainer() {
  const { items, moveItem } = useDashboardLayout();
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      moveItem(String(active.id), String(over?.id));
    }
  }

  // Sort items by order
  const sortedItems = [...items].sort((a, b) => a.order - b.order);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext 
        items={sortedItems.map(item => item.id)} 
        strategy={rectSortingStrategy}
      >
        <div className="adaf-grid gap-6">
          {sortedItems.map((item) => {
            const Component = COMPONENT_MAP[item.component as keyof typeof COMPONENT_MAP];
            
            if (!Component) {
              console.warn(`Component "${item.component}" not found in COMPONENT_MAP`);
              return null;
            }

            return (
              <DraggableCard 
                key={item.id} 
                id={item.id} 
                span={item.span}
              >
                <Component />
              </DraggableCard>
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}