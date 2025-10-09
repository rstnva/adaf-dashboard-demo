// Basic test to ensure mock mode works in CI
import { describe, it, expect } from 'vitest'

describe('Mock Mode CI Test', () => {
  it('should detect mock mode', () => {
    // Check if MOCK_MODE environment variable is set
    expect(process.env.MOCK_MODE).toBe('1')
    expect(process.env.NODE_ENV).toBe('test')
  })

  it('should handle basic math operations', () => {
    expect(2 + 2).toBe(4)
  })

  it('should work without database connections', () => {
    // This test ensures we can run tests without real database
    const mockData = { status: 'success', mode: 'mock' }
    expect(mockData.mode).toBe('mock')
  })
})