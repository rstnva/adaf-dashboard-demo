"use client";

import { useEffect, useState } from 'react';
import { wspI18n } from '../utils/i18n';
import { LazyVaultItem, createSummerLink } from '@/lib/integrations/summer/links';
// import { hasPermission } from '@/lib/auth/rbac'; // Using context-based RBAC instead
import { ExternalLink, Coins, TrendingUp } from 'lucide-react';

interface SummerData {
  lazyVaults: LazyVaultItem[];
  enabled: boolean;
  error?: string;
}

export function SummerLazyVaultsWidget() {
  const [data, setData] = useState<SummerData>({ lazyVaults: [], enabled: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSummerData() {
      try {
        // Check feature flag
        const summerEnabled = process.env.NEXT_PUBLIC_FF_SUMMER_ENABLED === 'true';
        if (!summerEnabled) {
          setData({ lazyVaults: [], enabled: false, error: 'Feature disabled' });
          setLoading(false);
          return;
        }

        // Check permission (using existing RBAC system)
        // Note: In production, this would check JWT permissions
        // For development, we allow access if feature flag is enabled

        const response = await fetch('/api/integrations/summer');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        setData({
          lazyVaults: result.lazyVaults || [],
          enabled: result.enabled || false
        });
      } catch (error) {
        console.error('[SummerLazyVaults] Fetch error:', error);
        setData({ 
          lazyVaults: [], 
          enabled: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      } finally {
        setLoading(false);
      }
    }

    fetchSummerData();
  }, []);

  const handleVaultClick = (vault: LazyVaultItem) => {
    // Record metrics
    if (typeof window !== 'undefined') {
      fetch('/api/metrics/wsp/integration-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'summer', widget: 'lazy' })
      }).catch(e => console.warn('Metrics error:', e));
    }
    
    const trackingUrl = createSummerLink(vault, 'adaf-wsp');
    window.open(trackingUrl, '_blank', 'noopener,noreferrer');
  };

  if (!data.enabled || loading) {
    return null; // Hide widget if disabled or loading
  }

  if (data.error) {
    return (
      <div className="wsp-widget summer-lazy-widget border rounded-lg p-4 bg-gray-50">
        <div className="font-semibold mb-2 text-gray-500">
          <Coins className="inline w-4 h-4 mr-1" />
          {wspI18n['wsp.summer.lazy.title']}
        </div>
        <div className="text-xs text-red-600">Error: {data.error}</div>
      </div>
    );
  }

  // Limit to 6 items for UI
  const displayVaults = data.lazyVaults.slice(0, 6);

  return (
    <div className="wsp-widget summer-lazy-widget border rounded-lg p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="font-semibold mb-2 text-blue-900">
        <Coins className="inline w-4 h-4 mr-1" />
        {wspI18n['wsp.summer.lazy.title']}
      </div>
      
      <div className="text-xs text-blue-700 mb-3">
        {wspI18n['wsp.summer.note.rewards']}
      </div>

      <div className="space-y-2">
        {displayVaults.map((vault) => (
          <div
            key={vault.id}
            onClick={() => handleVaultClick(vault)}
            className="flex items-center justify-between p-2 bg-white rounded border hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all duration-200"
          >
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-sm text-gray-900">{vault.asset}</span>
                <span className="text-xs text-gray-500">{vault.network}</span>
                {vault.apy && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-800">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {vault.apy}
                  </span>
                )}
              </div>
              {vault.tvl && (
                <div className="text-xs text-gray-600 mt-1">TVL: {vault.tvl}</div>
              )}
            </div>
            <ExternalLink className="w-3 h-3 text-blue-600" />
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-blue-200">
        <button
          onClick={() => window.open('https://pro.summer.fi/lazy-vaults', '_blank', 'noopener,noreferrer')}
          className="w-full text-xs bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors duration-200"
        >
          {wspI18n['wsp.summer.actions.open']}
        </button>
      </div>
    </div>
  );
}