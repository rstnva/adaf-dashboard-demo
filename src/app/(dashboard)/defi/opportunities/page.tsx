import { Metadata } from 'next';

import { DefiOpportunitiesDashboard } from '@/components/dashboard/defi/DefiOpportunitiesDashboard';

export const metadata: Metadata = {
  title: 'DeFi Yield Intelligence | ADAF Dashboard',
  description:
    'Explora oportunidades de rendimiento DeFi, APYs y TVL multichain en Gearbox, SummerFi, Aave, EigenLayer y más.',
};

export default function DefiOpportunitiesPage() {
  return <DefiOpportunitiesDashboard />;
}
