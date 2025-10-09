// Mock de React para tests - configuración global para vitest
import React from 'react'

// Hacer React disponible globalmente en tests
(globalThis as any).React = React

export default React