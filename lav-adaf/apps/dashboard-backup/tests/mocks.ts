// Mock global para html-to-image
export const mockHtmlToImage = {
  toPng: vi.fn().mockResolvedValue('data:image/png;base64,mockbase64data'),
  toJpeg: vi.fn().mockResolvedValue('data:image/jpeg;base64,mockbase64data'),
  toSvg: vi.fn().mockResolvedValue('<svg>mock svg</svg>'),
  toCanvas: vi.fn().mockResolvedValue(document.createElement('canvas'))
}

// Mock NextJS
export const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn()
}

// Mock datos ETF
export const mockEtfData = {
  btc: {
    totalAum: 50000000000,
    dailyFlow: 150000000,
    weeklyFlow: 750000000,
    price: 45000,
    change24h: 2.5,
    updatedAt: new Date().toISOString()
  },
  eth: {
    totalAum: 25000000000,
    dailyFlow: 75000000,
    weeklyFlow: 400000000,
    price: 2800,
    change24h: 1.8,
    updatedAt: new Date().toISOString()
  }
}

// Mock datos Farside
export const mockFarsideData = [
  { ticker: 'IBIT', flow: 150000000, aum: 15000000000 },
  { ticker: 'FBTC', flow: 75000000, aum: 8500000000 },
  { ticker: 'GBTC', flow: -50000000, aum: 12000000000 }
]