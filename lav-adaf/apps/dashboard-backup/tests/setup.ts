import '@testing-library/jest-dom'
import { beforeAll, vi } from 'vitest'
import React from 'react'

// Hacer React disponible globalmente
global.React = React
// También hacer disponibles los hooks de React
Object.assign(global, {
  useState: React.useState,
  useEffect: React.useEffect,
  useRef: React.useRef,
  useCallback: React.useCallback,
  useMemo: React.useMemo,
  useContext: React.useContext,
  useReducer: React.useReducer
})

// Mock html-to-image
vi.mock('html-to-image', () => ({
  toPng: vi.fn().mockResolvedValue('data:image/png;base64,mockbase64data'),
  toJpeg: vi.fn().mockResolvedValue('data:image/jpeg;base64,mockbase64data'),
  toSvg: vi.fn().mockResolvedValue('<svg>mock svg</svg>'),
  toCanvas: vi.fn().mockResolvedValue(document.createElement('canvas'))
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn()
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/dashboard'
}))

// Mock Redis/ioredis
vi.mock('ioredis', () => {
  const mockRedis = {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
    exists: vi.fn().mockResolvedValue(0),
    expire: vi.fn().mockResolvedValue(1),
    ttl: vi.fn().mockResolvedValue(-1),
    hget: vi.fn().mockResolvedValue(null),
    hset: vi.fn().mockResolvedValue(1),
    hdel: vi.fn().mockResolvedValue(1),
    hgetall: vi.fn().mockResolvedValue({}),
    lpush: vi.fn().mockResolvedValue(1),
    rpop: vi.fn().mockResolvedValue(null),
    llen: vi.fn().mockResolvedValue(0),
    disconnect: vi.fn().mockResolvedValue(undefined),
    quit: vi.fn().mockResolvedValue('OK'),
    on: vi.fn(),
    off: vi.fn(),
    connect: vi.fn().mockResolvedValue(undefined),
    status: 'ready'
  }
  return {
    default: vi.fn(() => mockRedis),
    Redis: vi.fn(() => mockRedis)
  }
})
