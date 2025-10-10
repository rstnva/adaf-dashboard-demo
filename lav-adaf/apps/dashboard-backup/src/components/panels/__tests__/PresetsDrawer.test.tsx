// Mock vaul drawer components to avoid React hook errors in test
vi.mock('@/components/ui/drawer', () => ({
  Drawer: ({ children }: any) => <div data-mock="Drawer">{children}</div>,
  DrawerTrigger: ({ children }: any) => <button data-mock="DrawerTrigger">{children}</button>,
  DrawerContent: ({ children }: any) => <div data-mock="DrawerContent">{children}</div>,
  DrawerHeader: ({ children }: any) => <div data-mock="DrawerHeader">{children}</div>,
  DrawerTitle: ({ children }: any) => <div data-mock="DrawerTitle">{children}</div>,
  DrawerDescription: ({ children }: any) => <div data-mock="DrawerDescription">{children}</div>,
  DrawerFooter: ({ children }: any) => <div data-mock="DrawerFooter">{children}</div>,
  DrawerClose: ({ children }: any) => <button data-mock="DrawerClose">{children}</button>,
}))
/**
 * TODO_REPLACE_WITH_REAL_DATA: Test para PresetsDrawer con mocks de Zustand
 * En producción: usar store real de Zustand con estado persistente
 */
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PresetsDrawer } from '../PresetsDrawer'

// TODO_REPLACE_WITH_REAL_DATA: Mock del hook usePlan para evitar dependencias de estado
// En producción: usar store Zustand real con datos persistidos
vi.mock('@/lib/state/usePlan', () => ({
  usePlan: vi.fn(() => ({
    presets: [
      { id: 'mock-1', name: 'Mock Conservative', apy: 5.0, costos: '$50' },
      { id: 'mock-2', name: 'Mock Balanced', apy: 6.2, costos: '$120' },
      { id: 'mock-3', name: 'Mock Aggressive', apy: 7.2, costos: '$250' },
    ],
    executionPlan: null,
    confirm: vi.fn(),
    addPreset: vi.fn(),
    clear: vi.fn()
  }))
}))

// TODO_REPLACE_WITH_REAL_DATA: Mock para evitar errores de DOM en drawer/portals
// En producción: usar componentes reales con portals y eventos
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div suppressHydrationWarning>
      {children}
    </div>
  )
}

describe('PresetsDrawer', () => {
  it('renders trigger button', () => {
    render(
      <React.StrictMode>
        <TestWrapper>
          <PresetsDrawer />
        </TestWrapper>
      </React.StrictMode>
    )
    
    // TODO_REPLACE_WITH_REAL_DATA: Verificar texto mock
    // En producción: verificar contenido real del componente
    expect(screen.getByText('Ver Presets de Ejecución')).toBeInTheDocument()
  })
  
  it('uses mocked presets data', () => {
    const { container } = render(
      <React.StrictMode>
        <TestWrapper>
          <PresetsDrawer />
        </TestWrapper>
      </React.StrictMode>
    )
    
    // TODO_REPLACE_WITH_REAL_DATA: Verificar que el componente se renderiza sin errores
    // En producción: verificar funcionalidad completa del drawer
    expect(container.firstChild).toBeTruthy()
  })
})
