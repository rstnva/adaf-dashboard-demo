'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Play,
  FileText,
  Bell,
  Settings,
  ChevronDown,
  Clock,
  DollarSign,
  Globe,
} from 'lucide-react';
import { useUIStore } from '@/store/ui';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

const AVAILABLE_ASSETS = [
  { symbol: 'BTC', name: 'Bitcoin', color: 'bg-orange-500' },
  { symbol: 'ETH', name: 'Ethereum', color: 'bg-blue-500' },
  { symbol: 'SOL', name: 'Solana', color: 'bg-purple-500' },
  { symbol: 'AVAX', name: 'Avalanche', color: 'bg-red-500' },
  { symbol: 'MATIC', name: 'Polygon', color: 'bg-indigo-500' },
];

const TIME_RANGES = [
  { value: '1D', label: '1 Día' },
  { value: '7D', label: '7 Días' },
  { value: '30D', label: '30 Días' },
  { value: '90D', label: '90 Días' },
  { value: '1Y', label: '1 Año' },
] as const;

const CURRENCIES = [
  { value: 'USD', label: 'USD', symbol: '$' },
  { value: 'MXN', label: 'MXN', symbol: '$' },
] as const;

const TIMEZONES = [
  { value: 'America/Mexico_City', label: 'Ciudad de México', short: 'CST' },
  { value: 'America/New_York', label: 'Nueva York', short: 'EST' },
  { value: 'Europe/London', label: 'Londres', short: 'GMT' },
  { value: 'Asia/Tokyo', label: 'Tokio', short: 'JST' },
] as const;

interface TopBarProps {
  children?: React.ReactNode;
}

export function TopBar({ children }: TopBarProps = {}) {
  const {
    selectedAssets,
    range,
    currency,
    timezone,
    setSelectedAssets,
    setRange,
    setCurrency,
    setTimezone,
    getFormattedAsOf,
  } = useUIStore();

  const [showAssetSelector, setShowAssetSelector] = useState(false);
  const [showRangeSelector, setShowRangeSelector] = useState(false);
  const [showCurrencySelector, setShowCurrencySelector] = useState(false);
  const [showTimezoneSelector, setShowTimezoneSelector] = useState(false);
  const [isRunningWorker, setIsRunningWorker] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [asOfText, setAsOfText] = useState<string>('—');
  const [keyHint, setKeyHint] = useState<string>('Ctrl');
  const [guidesAlways, setGuidesAlways] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const v = window.localStorage.getItem('pageguide:always');
    return v === null ? true : v !== '0' && v !== 'false';
  });

  const handleAssetToggle = (assetSymbol: string) => {
    if (selectedAssets.includes(assetSymbol)) {
      // Don't allow removing all assets
      if (selectedAssets.length > 1) {
        setSelectedAssets(selectedAssets.filter(a => a !== assetSymbol));
      }
    } else {
      setSelectedAssets([...selectedAssets, assetSymbol]);
    }
  };

  const handleRunWorker = async () => {
    setIsRunningWorker(true);
    try {
      const response = await fetch('/api/actions/run-worker-once', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to run worker');
      }

      // Track UI interaction
      fetch('/api/metrics/ui/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          component: 'TopBar',
          action: 'run_worker_once',
          timestamp: new Date().toISOString(),
        }),
      }).catch(console.error);
    } catch (error) {
      console.error('Failed to run worker:', error);
    } finally {
      setIsRunningWorker(false);
    }
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const response = await fetch('/api/generate/report/onepager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Required by the API
          actor: 'local-user',
          // Optional metadata we may use in the PDF template later
          notes: `Assets: ${selectedAssets.join(', ')} | Range: ${range} | Currency: ${currency} | TZ: ${timezone}`,
          period: 'q',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }
      // Handle PDF download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      // Try to extract filename from Content-Disposition
      const cd =
        response.headers.get('Content-Disposition') ||
        response.headers.get('content-disposition');
      const fallbackName = `ADAF_OnePager_${new Date().toISOString().split('T')[0]}.pdf`;
      let fileName = fallbackName;
      if (cd) {
        const match = cd.match(/filename="?([^";]+)"?/i);
        if (match?.[1]) fileName = match[1];
      }
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      // Track UI interaction
      fetch('/api/metrics/ui/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          component: 'TopBar',
          action: 'generate_one_pager',
          timestamp: new Date().toISOString(),
        }),
      }).catch(console.error);

      // Lightweight success toast
      const toast = document.createElement('div');
      toast.className =
        'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg z-50';
      toast.textContent = 'Reporte generado y descargado';
      document.body.appendChild(toast);
      setTimeout(() => document.body.removeChild(toast), 2000);
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const toggleGuidesAlways = () => {
    const next = !guidesAlways;
    setGuidesAlways(next);
    try {
      window.localStorage.setItem('pageguide:always', next ? '1' : '0');
      window.dispatchEvent(new Event('pageguide:always-changed'));
    } catch (err) {
      console.warn('Failed to persist PageGuide preference', err);
    }
  };

  // Hydration-safe UI bits: compute after mount only
  useEffect(() => {
    setMounted(true);
    try {
      setAsOfText(getFormattedAsOf());
    } catch {
      setAsOfText('—');
    }
    try {
      const isMac =
        typeof navigator !== 'undefined' &&
        navigator.platform?.toUpperCase().includes('MAC');
      setKeyHint(isMac ? '⌘' : 'Ctrl');
    } catch {
      setKeyHint('Ctrl');
    }
  }, [getFormattedAsOf]);

  return (
    <div className="sticky top-0 z-50 px-6 pt-6">
      <div className="glass-panel flex h-[88px] items-center gap-6 px-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAssetSelector(!showAssetSelector)}
              className="h-10 min-w-[140px] justify-between rounded-2xl border-white/20 bg-white/10 text-slate-100 hover:bg-white/16"
            >
              <div className="flex items-center gap-1.5">
                {selectedAssets.slice(0, 2).map(asset => {
                  const assetInfo = AVAILABLE_ASSETS.find(
                    a => a.symbol === asset
                  );
                  return (
                    <div
                      key={asset}
                      className={cn(
                        'h-2.5 w-2.5 rounded-full',
                        assetInfo?.color
                      )}
                    />
                  );
                })}
                <span className="ml-2 font-semibold tracking-tight">
                  {selectedAssets.length === 1
                    ? selectedAssets[0]
                    : `${selectedAssets.length} Assets`}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 opacity-70" />
            </Button>

            {showAssetSelector && (
              <div className="glass-panel absolute top-full mt-3 w-64 rounded-2xl border-white/20 bg-slate-900/70 p-4 text-slate-100">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-300/70">
                    Assets
                  </h4>
                  {AVAILABLE_ASSETS.map(asset => (
                    <label
                      key={asset.symbol}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm transition-colors hover:border-white/25"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedAssets.includes(asset.symbol)}
                          onChange={() => handleAssetToggle(asset.symbol)}
                          className="h-4 w-4 rounded border-white/30 bg-transparent text-sky-400 focus:ring-sky-400/60"
                        />
                        <div
                          className={cn('h-3 w-3 rounded-full', asset.color)}
                        />
                        <span>
                          {asset.name} ({asset.symbol})
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="mt-4 flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => setShowAssetSelector(false)}
                    className="rounded-xl bg-white/15 px-4 text-slate-100 hover:bg-white/25"
                  >
                    Done
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRangeSelector(!showRangeSelector)}
              className="h-10 rounded-2xl border-white/20 bg-white/10 px-4 text-slate-100 hover:bg-white/16"
            >
              <Clock className="h-4 w-4" />
              <span className="ml-2 font-semibold">{range}</span>
              <ChevronDown className="ml-1 h-4 w-4 opacity-70" />
            </Button>

            {showRangeSelector && (
              <div className="glass-panel absolute top-full mt-3 w-36 rounded-2xl border-white/20 bg-slate-900/70 py-2 text-sm text-slate-100">
                {TIME_RANGES.map(r => (
                  <button
                    key={r.value}
                    onClick={() => {
                      setRange(r.value);
                      setShowRangeSelector(false);
                    }}
                    className={cn(
                      'flex w-full items-center justify-between px-4 py-2 hover:bg-white/10',
                      range === r.value && 'text-sky-300'
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCurrencySelector(!showCurrencySelector)}
              className="h-10 rounded-2xl border-white/20 bg-white/10 px-4 text-slate-100 hover:bg-white/16"
            >
              <DollarSign className="h-4 w-4" />
              <span className="ml-2 font-semibold">{currency}</span>
              <ChevronDown className="ml-1 h-4 w-4 opacity-70" />
            </Button>

            {showCurrencySelector && (
              <div className="glass-panel absolute top-full mt-3 w-28 rounded-2xl border-white/20 bg-slate-900/70 py-2 text-sm text-slate-100">
                {CURRENCIES.map(c => (
                  <button
                    key={c.value}
                    onClick={() => {
                      setCurrency(c.value);
                      setShowCurrencySelector(false);
                    }}
                    className={cn(
                      'flex w-full items-center justify-between px-4 py-2 hover:bg-white/10',
                      currency === c.value && 'text-sky-300'
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTimezoneSelector(!showTimezoneSelector)}
              className="h-10 rounded-2xl border-white/20 bg-white/10 px-4 text-slate-100 hover:bg-white/16"
            >
              <Globe className="h-4 w-4" />
              <span className="ml-2 font-semibold">
                {TIMEZONES.find(tz => tz.value === timezone)?.short}
              </span>
              <ChevronDown className="ml-1 h-4 w-4 opacity-70" />
            </Button>

            {showTimezoneSelector && (
              <div className="glass-panel absolute top-full mt-3 w-60 rounded-2xl border-white/20 bg-slate-900/70 py-3 text-sm text-slate-100">
                {TIMEZONES.map(tz => (
                  <button
                    key={tz.value}
                    onClick={() => {
                      setTimezone(tz.value);
                      setShowTimezoneSelector(false);
                    }}
                    className={cn(
                      'flex w-full items-center justify-between px-4 py-2 hover:bg-white/10',
                      timezone === tz.value && 'text-sky-300'
                    )}
                  >
                    <span>{tz.label}</span>
                    <span className="text-xs text-slate-300/70">
                      {tz.short}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Badge
            variant="outline"
            className="border-white/20 bg-white/5 px-4 text-xs text-slate-200/80"
          >
            as of {mounted ? asOfText : '—'}
          </Badge>
        </div>

        <div className="flex-1 max-w-lg">
          <Button
            variant="outline"
            onClick={() =>
              window.dispatchEvent(new CustomEvent('spotlight:open'))
            }
            className="group w-full justify-start rounded-2xl border-white/20 bg-white/8 px-4 py-3 text-sm text-slate-300/90 hover:border-white/30 hover:bg-white/14 hover:text-white"
          >
            <Search className="mr-3 h-4 w-4 text-sky-300 group-hover:text-sky-200" />
            <span>Búsqueda Spotlight...</span>
            <div className="ml-auto flex items-center gap-1 text-[11px] text-slate-400/80">
              <kbd className="rounded-lg border border-white/20 bg-white/10 px-2 py-1">
                {keyHint}
              </kbd>
              <kbd className="rounded-lg border border-white/20 bg-white/10 px-2 py-1">
                K
              </kbd>
            </div>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={guidesAlways ? 'default' : 'outline'}
            onClick={toggleGuidesAlways}
            className="rounded-2xl px-4"
          >
            <Sparkles className="mr-1 h-4 w-4" />
            {guidesAlways ? 'Guías: ON' : 'Guías: OFF'}
          </Button>
          <Button
            size="sm"
            onClick={handleRunWorker}
            disabled={isRunningWorker}
            className="rounded-2xl bg-emerald-500/20 px-4 text-emerald-100 hover:bg-emerald-500/30"
          >
            <Play className="mr-1 h-4 w-4" />
            {isRunningWorker ? 'Running...' : 'Run Worker'}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleGenerateReport}
            disabled={isGeneratingReport}
            className="rounded-2xl border-white/20 px-4 text-slate-200 hover:border-white/35 hover:text-white"
          >
            <FileText className="mr-1 h-4 w-4" />
            {isGeneratingReport ? 'Generating...' : 'One-Pager'}
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="relative rounded-2xl border-white/20 px-3 text-slate-200 hover:border-white/30"
          >
            <Bell className="h-4 w-4" />
            <Badge className="absolute -top-2 -right-1 h-5 w-5 rounded-full border-white/20 bg-rose-500/60 text-[11px] text-white">
              3
            </Badge>
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="rounded-2xl border-white/20 px-3 text-slate-200 hover:border-white/30"
          >
            <Settings className="h-4 w-4" />
          </Button>

          {children}
        </div>
      </div>
    </div>
  );
}
