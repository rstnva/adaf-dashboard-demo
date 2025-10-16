import { PrismaClient } from '@prisma/client';
import { addDays, subDays } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  // Seed Users & Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: { name: 'admin' },
  });
  const analystRole = await prisma.role.upsert({
    where: { name: 'analyst' },
    update: {},
    create: { name: 'analyst' },
  });
  const adminUser = await prisma.user.upsert({
    where: { email: 'demo@adaf.com' },
    update: {},
    create: { email: 'demo@adaf.com', roleId: adminRole.id },
  });

  const analystUser = await prisma.user.upsert({
    where: { email: 'analyst@adaf.com' },
    update: {},
    create: { email: 'analyst@adaf.com', roleId: analystRole.id },
  });

  console.log('👥 Roles iniciales listos', {
    admin: adminRole.name,
    analyst: analystRole.name,
  });
  console.log('📧 Usuarios sembrados', {
    admin: adminUser.email,
    analyst: analystUser.email,
  });

  // Seed NewsData
  await prisma.newsData.createMany({
    data: [
      {
        title: 'Bitcoin Breaks $50k Resistance Level',
        description:
          'Major bullish momentum as Bitcoin surpasses key resistance...',
        link: 'https://example.com/bitcoin-news',
        pubDate: subDays(new Date(), 1),
        source: 'CryptoNews',
        sentiment: 0.8,
        keywords: ['bitcoin', 'bullish', 'market'],
      },
      {
        title: 'URGENT: Major Exchange Hack Detected',
        description: 'Security breach affects millions of users...',
        link: 'https://example.com/hack-alert',
        pubDate: subDays(new Date(), 2),
        source: 'SecurityAlert',
        sentiment: -0.9,
        keywords: ['hack', 'security', 'exchange'],
      },
      {
        title: 'Ethereum Network Upgrade Scheduled',
        description: 'The next Ethereum update brings improved scalability...',
        link: 'https://example.com/eth-upgrade',
        pubDate: addDays(new Date(), 2),
        source: 'EthereumDaily',
        sentiment: 0.5,
        keywords: ['ethereum', 'upgrade', 'scalability'],
      },
    ],
    skipDuplicates: true,
  });

  // Seed Signals
  await prisma.agentSignal.createMany({
    data: [
      {
        id: 'sig1',
        type: 'news',
        source: 'CryptoNews',
        title: 'Bitcoin Breaks $50k Resistance Level',
        description:
          'Major bullish momentum as Bitcoin surpasses key resistance...',
        severity: 'high',
        metadata: { tickers: ['BTC'], keywords: ['bitcoin', 'bullish'] },
        fingerprint: 'btc-50k',
        processed: true,
        timestamp: subDays(new Date(), 1),
      },
      {
        id: 'sig2',
        type: 'news',
        source: 'SecurityAlert',
        title: 'URGENT: Major Exchange Hack Detected',
        description: 'Security breach affects millions of users...',
        severity: 'critical',
        metadata: { tickers: ['EXCH'], keywords: ['hack', 'security'] },
        fingerprint: 'exch-hack',
        processed: true,
        timestamp: subDays(new Date(), 2),
      },
    ],
    skipDuplicates: true,
  });

  // Seed Alerts
  await prisma.alert.createMany({
    data: [
      {
        id: 'alert1',
        signalId: 'sig2',
        type: 'security',
        severity: 'critical',
        title: 'Exchange Hack',
        description: 'Detected hack on major exchange',
        metadata: { exchange: 'BigEx' },
        resolved: false,
        timestamp: subDays(new Date(), 2),
      },
    ],
    skipDuplicates: true,
  });

  // Seed Opportunities
  await prisma.opportunity.createMany({
    data: [
      {
        id: 'opp1',
        signalId: 'sig1',
        type: 'arbitrage',
        confidence: 0.95,
        title: 'BTC Arbitrage',
        description: 'Arbitrage opportunity detected for BTC',
        metadata: { spread: 0.5 },
        status: 'proposed',
        expired: false,
        timestamp: subDays(new Date(), 1),
      },
    ],
    skipDuplicates: true,
  });

  // Seed TVLData
  await prisma.tVLData.createMany({
    data: [
      {
        protocol: 'Uniswap',
        chain: 'Ethereum',
        tvl: 5000000000,
        change24h: 2.5,
        change7d: 5.1,
        change30d: 10.2,
        timestamp: new Date(),
      },
    ],
    skipDuplicates: true,
  });

  // Seed PriceData
  await prisma.priceData.createMany({
    data: [
      {
        symbol: 'BTC',
        exchange: 'Binance',
        price: 51000,
        volume24h: 100000000,
        timestamp: new Date(),
      },
      {
        symbol: 'ETH',
        exchange: 'Coinbase',
        price: 3500,
        volume24h: 50000000,
        timestamp: new Date(),
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Mock data seeded!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
