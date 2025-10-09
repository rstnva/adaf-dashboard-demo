/**
 * Summer.fi Layout Migration
 * 
 * Migración idempotente que agrega widgets Summer.fi al layout WSP
 * sin modificar configuraciones existentes de usuarios
 */

export interface LayoutMigration {
  version: string;
  applied: boolean;
  timestamp?: string;
}

export interface WSPLayoutConfig {
  version: string;
  lanes: {
    [laneId: string]: {
      widgets: string[];
      order: number;
      collapsed?: boolean;
    }
  };
  migrations?: LayoutMigration[];
}

const SUMMER_MIGRATION_V1 = {
  version: 'summer-v1.0',
  widgets: [
    'SummerLazyVaultsWidget',
    'SummerMultiplyWidget'
  ],
  targetLane: 'onchain-yield-leverage'
};

/**
 * Aplica la migración Summer.fi de forma no disruptiva
 * Solo agrega widgets si no existen ya en el layout del usuario
 */
export function applySummerMigration(existingLayout?: WSPLayoutConfig): WSPLayoutConfig {
  // Si no hay layout existente, crear uno nuevo con Summer.fi
  if (!existingLayout) {
    return {
      version: 'v1.1',
      lanes: {
        [SUMMER_MIGRATION_V1.targetLane]: {
          widgets: [...SUMMER_MIGRATION_V1.widgets],
          order: 0
        }
      },
      migrations: [{
        version: SUMMER_MIGRATION_V1.version,
        applied: true,
        timestamp: new Date().toISOString()
      }]
    };
  }

  // Verificar si la migración ya se aplicó
  const migrationApplied = existingLayout.migrations?.some(
    m => m.version === SUMMER_MIGRATION_V1.version && m.applied
  );

  if (migrationApplied) {
    return existingLayout; // No changes needed
  }

  // Crear copia del layout existente
  const newLayout: WSPLayoutConfig = {
    ...existingLayout,
    version: 'v1.1',
    lanes: { ...existingLayout.lanes },
    migrations: [...(existingLayout.migrations || [])]
  };

  // Verificar si el lane target existe
  if (!newLayout.lanes[SUMMER_MIGRATION_V1.targetLane]) {
    // Crear el lane si no existe
    newLayout.lanes[SUMMER_MIGRATION_V1.targetLane] = {
      widgets: [...SUMMER_MIGRATION_V1.widgets],
      order: Object.keys(newLayout.lanes).length
    };
  } else {
    // Agregar widgets que no existen ya
    const existingWidgets = newLayout.lanes[SUMMER_MIGRATION_V1.targetLane].widgets;
    const widgetsToAdd = SUMMER_MIGRATION_V1.widgets.filter(
      widget => !existingWidgets.includes(widget)
    );
    
    if (widgetsToAdd.length > 0) {
      newLayout.lanes[SUMMER_MIGRATION_V1.targetLane].widgets.push(...widgetsToAdd);
    }
  }

  // Marcar migración como aplicada
  newLayout.migrations.push({
    version: SUMMER_MIGRATION_V1.version,
    applied: true,
    timestamp: new Date().toISOString()
  });

  return newLayout;
}

/**
 * Revierte la migración Summer.fi (para rollback)
 */
export function revertSummerMigration(layout: WSPLayoutConfig): WSPLayoutConfig {
  const newLayout: WSPLayoutConfig = {
    ...layout,
    lanes: { ...layout.lanes },
    migrations: [...(layout.migrations || [])]
  };

  // Remover widgets Summer.fi del lane
  if (newLayout.lanes[SUMMER_MIGRATION_V1.targetLane]) {
    newLayout.lanes[SUMMER_MIGRATION_V1.targetLane].widgets = 
      newLayout.lanes[SUMMER_MIGRATION_V1.targetLane].widgets.filter(
        widget => !SUMMER_MIGRATION_V1.widgets.includes(widget)
      );
  }

  // Marcar migración como revertida
  const migrationIndex = newLayout.migrations.findIndex(
    m => m.version === SUMMER_MIGRATION_V1.version
  );
  
  if (migrationIndex >= 0) {
    newLayout.migrations[migrationIndex] = {
      ...newLayout.migrations[migrationIndex],
      applied: false,
      timestamp: new Date().toISOString()
    };
  }

  return newLayout;
}

/**
 * Hook para aplicar migración automáticamente en el cliente
 */
export function useSummerLayoutMigration() {
  const applyMigrationIfNeeded = () => {
    const layoutKey = 'wsp-layout-v1';
    const existingLayoutStr = localStorage.getItem(layoutKey);
    const existingLayout = existingLayoutStr ? JSON.parse(existingLayoutStr) : null;
    
    const migratedLayout = applySummerMigration(existingLayout);
    
    // Solo guardar si hubo cambios
    if (JSON.stringify(migratedLayout) !== JSON.stringify(existingLayout)) {
      localStorage.setItem(layoutKey, JSON.stringify(migratedLayout));
      console.log('Summer.fi layout migration applied');
      return true;
    }
    
    return false;
  };

  return { applyMigrationIfNeeded };
}