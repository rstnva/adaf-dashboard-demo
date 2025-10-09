/**
 * Summer.fi Deep Links Configuration
 * Canonical URLs for Summer.fi Pro and Lazy Vaults
 */

export interface SummerLink {
  url: string
  label: string
  target?: '_blank' | '_self'
  category: 'multiply' | 'lazy-vault'
}

export interface LazyVaultItem {
  id: string
  asset: string
  network: string
  label: string
  note: string
  apy?: string
  tvl?: string
  link: SummerLink
}

export interface MultiplyItem {
  id: string
  pair: string
  asset: string
  network: string
  features: {
    autoBuy: boolean
    autoSell: boolean
    takeProfit: boolean
    stopLoss: boolean
    trailingSL: boolean
  }
  link: SummerLink
}

/**
 * Summer.fi Base URLs
 */
export const SUMMER_BASE_URLS = {
  main: 'https://summer.fi',
  pro: 'https://pro.summer.fi'
} as const

/**
 * Lazy Vaults Static Data (v0 - validated content)
 */
export const LAZY_VAULTS: LazyVaultItem[] = [
  {
    id: 'lazy-eth-mainnet',
    asset: 'ETH',
    network: 'Ethereum',
    label: 'Lazy Summer Vault',
    note: 'Rebalanced by AI/keepers, $SUMR rewards',
    apy: '~8.5%',
    tvl: '$12.3M',
    link: {
      url: `${SUMMER_BASE_URLS.pro}/lazy-vaults/ethereum/eth`,
      label: 'Open ETH Lazy Vault',
      target: '_blank',
      category: 'lazy-vault'
    }
  },
  {
    id: 'lazy-wbtc-mainnet',
    asset: 'WBTC',
    network: 'Ethereum',
    label: 'Lazy Summer Vault',
    note: 'Rebalanced by AI/keepers, $SUMR rewards',
    apy: '~6.2%',
    tvl: '$8.7M',
    link: {
      url: `${SUMMER_BASE_URLS.pro}/lazy-vaults/ethereum/wbtc`,
      label: 'Open WBTC Lazy Vault',
      target: '_blank',
      category: 'lazy-vault'
    }
  },
  {
    id: 'lazy-dai-mainnet',
    asset: 'DAI',
    network: 'Ethereum',
    label: 'Lazy Summer Vault',
    note: 'Rebalanced by AI/keepers, $SUMR rewards',
    apy: '~4.8%',
    tvl: '$15.2M',
    link: {
      url: `${SUMMER_BASE_URLS.pro}/lazy-vaults/ethereum/dai`,
      label: 'Open DAI Lazy Vault',
      target: '_blank',
      category: 'lazy-vault'
    }
  },
  {
    id: 'lazy-usdc-mainnet',
    asset: 'USDC',
    network: 'Ethereum',
    label: 'Lazy Summer Vault',
    note: 'Rebalanced by AI/keepers, $SUMR rewards',
    apy: '~5.1%',
    tvl: '$22.8M',
    link: {
      url: `${SUMMER_BASE_URLS.pro}/lazy-vaults/ethereum/usdc`,
      label: 'Open USDC Lazy Vault',
      target: '_blank',
      category: 'lazy-vault'
    }
  },
  {
    id: 'lazy-wsteth-mainnet',
    asset: 'wstETH',
    network: 'Ethereum',
    label: 'Lazy Summer Vault',
    note: 'Rebalanced by AI/keepers, $SUMR rewards',
    apy: '~9.2%',
    tvl: '$18.5M',
    link: {
      url: `${SUMMER_BASE_URLS.pro}/lazy-vaults/ethereum/wsteth`,
      label: 'Open wstETH Lazy Vault',
      target: '_blank',
      category: 'lazy-vault'
    }
  },
  {
    id: 'lazy-reth-mainnet',
    asset: 'rETH',
    network: 'Ethereum',
    label: 'Lazy Summer Vault',
    note: 'Rebalanced by AI/keepers, $SUMR rewards',
    apy: '~8.8%',
    tvl: '$9.4M',
    link: {
      url: `${SUMMER_BASE_URLS.pro}/lazy-vaults/ethereum/reth`,
      label: 'Open rETH Lazy Vault',
      target: '_blank',
      category: 'lazy-vault'
    }
  }
]

/**
 * Multiply & Automation Static Data (v0 - validated content)
 */
export const MULTIPLY_POSITIONS: MultiplyItem[] = [
  {
    id: 'multiply-eth-mainnet',
    pair: 'ETH/USD',
    asset: 'ETH',
    network: 'Ethereum',
    features: {
      autoBuy: true,
      autoSell: true,
      takeProfit: true,
      stopLoss: true,
      trailingSL: true
    },
    link: {
      url: `${SUMMER_BASE_URLS.main}/multiply/ethereum/eth`,
      label: 'Open ETH Multiply',
      target: '_blank',
      category: 'multiply'
    }
  },
  {
    id: 'multiply-wbtc-mainnet',
    pair: 'WBTC/USD',
    asset: 'WBTC',
    network: 'Ethereum',
    features: {
      autoBuy: true,
      autoSell: true,
      takeProfit: true,
      stopLoss: true,
      trailingSL: false
    },
    link: {
      url: `${SUMMER_BASE_URLS.main}/multiply/ethereum/wbtc`,
      label: 'Open WBTC Multiply',
      target: '_blank',
      category: 'multiply'
    }
  },
  {
    id: 'multiply-dai-mainnet',
    pair: 'DAI/USD',
    asset: 'DAI',
    network: 'Ethereum',
    features: {
      autoBuy: false,
      autoSell: false,
      takeProfit: true,
      stopLoss: true,
      trailingSL: false
    },
    link: {
      url: `${SUMMER_BASE_URLS.main}/multiply/ethereum/dai`,
      label: 'Open DAI Multiply',
      target: '_blank',
      category: 'multiply'
    }
  },
  {
    id: 'multiply-usdc-mainnet',
    pair: 'USDC/USD',
    asset: 'USDC',
    network: 'Ethereum',
    features: {
      autoBuy: false,
      autoSell: false,
      takeProfit: true,
      stopLoss: true,
      trailingSL: false
    },
    link: {
      url: `${SUMMER_BASE_URLS.main}/multiply/ethereum/usdc`,
      label: 'Open USDC Multiply',
      target: '_blank',
      category: 'multiply'
    }
  }
]

/**
 * Source Documentation for Audits
 */
export const SUMMER_SOURCE_DOCS = {
  main: 'https://docs.summer.fi',
  multiply: 'https://docs.summer.fi/products/multiply',
  lazyVaults: 'https://docs.summer.fi/products/lazy-summer-vaults',
  blog: 'https://blog.summer.fi',
  github: 'https://github.com/OasisDEX'
} as const

/**
 * Generate Summer.fi link with tracking
 */
export function createSummerLink(item: LazyVaultItem | MultiplyItem, source = 'adaf-dashboard'): string {
  const baseUrl = item.link.url
  const params = new URLSearchParams({ utm_source: source, utm_medium: 'integration' })
  return `${baseUrl}?${params.toString()}`
}

/**
 * Validate Summer.fi link structure
 */
export function isValidSummerLink(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.hostname === 'summer.fi' || parsed.hostname === 'pro.summer.fi'
  } catch {
    return false
  }
}