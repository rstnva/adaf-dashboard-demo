"use client";

import { useEffect, useState } from 'react';
import { wspI18n } from '../utils/i18n';
import { MultiplyItem, createSummerLink } from '@/lib/integrations/summer/links';
// import { hasPermission } from '@/lib/auth/rbac'; // Using context-based RBAC instead
import { ExternalLink, Zap, TrendingUp, Shield, Target, AlertTriangle } from 'lucide-react';

interface SummerData {
  multiply: MultiplyItem[];
  enabled: boolean;
  error?: string;
}

const FEATURE_ICONS = {
  autoBuy: TrendingUp,
  autoSell: TrendingUp,
  takeProfit: Target,
  stopLoss: Shield,
  trailingSL: AlertTriangle
} as const;

export function SummerMultiplyWidget() {
  const [data, setData] = useState<SummerData>({ multiply: [], enabled: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSummerData() {
      try {
        // Check feature flag
        const summerEnabled = process.env.NEXT_PUBLIC_FF_SUMMER_ENABLED === 'true';
        if (!summerEnabled) {
          setData({ multiply: [], enabled: false, error: 'Feature disabled' });
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
          multiply: result.multiply || [],
          enabled: result.enabled || false
        });
      } catch (error) {
        console.error('[SummerMultiply] Fetch error:', error);
        setData({ 
          multiply: [], 
          enabled: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      } finally {
        setLoading(false);
      }
    }

    fetchSummerData();
  }, []);

  const handleMultiplyClick = (position: MultiplyItem) => {
    // Record metrics
    if (typeof window !== 'undefined') {
      fetch('/api/metrics/wsp/integration-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'summer', widget: 'multiply' })
      }).catch(e => console.warn('Metrics error:', e));
    }
    
    const trackingUrl = createSummerLink(position, 'adaf-wsp');
    window.open(trackingUrl, '_blank', 'noopener,noreferrer');
  };

  const renderFeatureBadge = (featureKey: keyof MultiplyItem['features'], enabled: boolean) => {
    if (!enabled) return null;
    
    const Icon = FEATURE_ICONS[featureKey];
    const label = wspI18n[`wsp.summer.badge.${featureKey}`] as string;
    
    const colorMap = {
      autoBuy: 'bg-green-100 text-green-800',
      autoSell: 'bg-orange-100 text-orange-800',
      takeProfit: 'bg-blue-100 text-blue-800',
      stopLoss: 'bg-red-100 text-red-800',
      trailingSL: 'bg-purple-100 text-purple-800'
    };

    return (
      <span
        key={featureKey}
        className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs ${colorMap[featureKey]} mr-1 mb-1`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </span>
    );
  };

  if (!data.enabled || loading) {
    return null; // Hide widget if disabled or loading
  }

  if (data.error) {
    return (
      <div className="wsp-widget summer-multiply-widget border rounded-lg p-4 bg-gray-50">
        <div className="font-semibold mb-2 text-gray-500">
          <Zap className="inline w-4 h-4 mr-1" />
          {wspI18n['wsp.summer.multiply.title']}
        </div>
        <div className="text-xs text-red-600">Error: {data.error}</div>
      </div>
    );
  }

  // Limit to 6 items for UI
  const displayPositions = data.multiply.slice(0, 6);

  return (
    <div className="wsp-widget summer-multiply-widget border rounded-lg p-4 bg-gradient-to-br from-orange-50 to-yellow-50">
      <div className="font-semibold mb-2 text-orange-900">
        <Zap className="inline w-4 h-4 mr-1" />
        {wspI18n['wsp.summer.multiply.title']}
      </div>
      
      <div className="text-xs text-orange-700 mb-3">
        Leverage & automation for DeFi positions
      </div>

      <div className="space-y-3">
        {displayPositions.map((position) => (
          <div
            key={position.id}
            onClick={() => handleMultiplyClick(position)}
            className="p-3 bg-white rounded border hover:border-orange-300 hover:shadow-sm cursor-pointer transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-medium text-sm text-gray-900">{position.pair}</span>
                <span className="text-xs text-gray-500 ml-2">{position.network}</span>
              </div>
              <ExternalLink className="w-3 h-3 text-orange-600" />
            </div>
            
            <div className="flex flex-wrap">
              {Object.entries(position.features).map(([key, enabled]) =>
                renderFeatureBadge(key as keyof MultiplyItem['features'], enabled)
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-orange-200">
        <button
          onClick={() => window.open('https://summer.fi/multiply', '_blank', 'noopener,noreferrer')}
          className="w-full text-xs bg-orange-600 text-white py-2 rounded hover:bg-orange-700 transition-colors duration-200"
        >
          {wspI18n['wsp.summer.actions.open']}
        </button>
      </div>
    </div>
  );
}