import type { Metadata } from 'next';

import { DefiOpportunitiesDashboard } from '@/components/dashboard/defi/DefiOpportunitiesDashboard';

export const metadata: Metadata = {
  title: 'DeFi Yield Intelligence | ADAF Dashboard',
  description: 'Explora oportunidades de rendimiento DeFi con métricas de APY, TVL y riesgo en tiempo real.',
};

export default function DefiOpportunitiesPage() {
  return <DefiOpportunitiesDashboard />;
}
