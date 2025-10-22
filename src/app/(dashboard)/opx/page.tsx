/**
 * OPX (Operational Excellence) Page
 *
 * Triage dashboard for agent-proposed opportunities
 * Filters, scoring, approval/rejection workflow
 *
 * Mock-first implementation - Replace with real data when ready
 * TODO_REPLACE_WITH_REAL_DATA: Connect to opportunity database
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import OpxTriageTable from '@/components/OpxTriageTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Filter,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// =============================================================================
// Types
// =============================================================================

type OpxItem = {
  id: string;
  createdAt: string;
  agentCode: string;
  idea: string;
  thesis: string;
  risks: string[];
  sizing: { notionalPctNAV: number; maxDDbps?: number };
  var: number;
  type: 'beta' | 'basis' | 'realYield' | 'arb';
  status: 'proposed' | 'approved' | 'rejected';
  score: number;
  consensus: number;
  blocking: string[];
};

type FilterState = {
  minScore: number;
  type: string;
  status: string;
};

// =============================================================================
// Mock Data Generator (Fortune 500 Mock-First Strategy)
// =============================================================================

const MOCK_AGENTS = [
  'ALPHA-001',
  'BETA-042',
  'GAMMA-007',
  'DELTA-019',
  'SIGMA-033',
];
const MOCK_TYPES: OpxItem['type'][] = ['beta', 'basis', 'realYield', 'arb'];
const MOCK_STATUSES: OpxItem['status'][] = ['proposed', 'approved', 'rejected'];

const MOCK_IDEAS = [
  {
    idea: 'ETH LST Arbitrage',
    thesis: 'Exploit stETH/ETH peg deviation during high volatility',
  },
  {
    idea: 'BTC Funding Capture',
    thesis: 'Long-term positive funding rates on perpetual futures',
  },
  {
    idea: 'SOL Ecosystem Growth',
    thesis: 'DeFi TVL growth outpacing price action',
  },
  {
    idea: 'Curve Wars Participation',
    thesis: 'vlCVX accumulation for governance power',
  },
  {
    idea: 'Real World Assets Yield',
    thesis: 'Tokenized treasury yields beating DeFi',
  },
  {
    idea: 'MEV Protection Trade',
    thesis: 'Flashbots protect bundle submission arbitrage',
  },
  { idea: 'Liquidity Mining Farm', thesis: 'New protocol incentive programs' },
  {
    idea: 'Options Volatility Play',
    thesis: 'IV underpricing on upcoming events',
  },
];

const MOCK_RISKS = [
  'Smart contract risk',
  'Liquidity risk',
  'Regulatory uncertainty',
  'Oracle dependency',
  'Counterparty risk',
  'Impermanent loss',
  'Slippage on execution',
  'Gas cost volatility',
];

function generateMockOpportunities(count: number): OpxItem[] {
  const opportunities: OpxItem[] = [];

  for (let i = 0; i < count; i++) {
    const idea = MOCK_IDEAS[Math.floor(Math.random() * MOCK_IDEAS.length)];
    const numRisks = 2 + Math.floor(Math.random() * 3); // 2-4 risks
    const risks = Array.from(
      { length: numRisks },
      () => MOCK_RISKS[Math.floor(Math.random() * MOCK_RISKS.length)]
    );

    const score = 30 + Math.floor(Math.random() * 70); // 30-100
    const consensus = 0.5 + Math.random() * 0.5; // 50-100%
    const hasBlocking = Math.random() < 0.3; // 30% chance

    opportunities.push({
      id: `opx-${Date.now()}-${i}`,
      createdAt: new Date(
        Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
      ).toISOString(),
      agentCode: MOCK_AGENTS[Math.floor(Math.random() * MOCK_AGENTS.length)],
      idea: idea.idea,
      thesis: idea.thesis,
      risks: [...new Set(risks)], // Remove duplicates
      sizing: {
        notionalPctNAV: parseFloat((1 + Math.random() * 9).toFixed(2)), // 1-10%
        maxDDbps: Math.floor(100 + Math.random() * 400), // 100-500 bps
      },
      var: parseFloat((0.5 + Math.random() * 2).toFixed(2)), // 0.5-2.5%
      type: MOCK_TYPES[Math.floor(Math.random() * MOCK_TYPES.length)],
      status: MOCK_STATUSES[Math.floor(Math.random() * MOCK_STATUSES.length)],
      score,
      consensus: parseFloat((consensus * 100).toFixed(1)),
      blocking: hasBlocking
        ? ['Compliance review pending', 'Risk limit exceeded']
        : [],
    });
  }

  return opportunities.sort((a, b) => b.score - a.score);
}

// =============================================================================
// Main Component
// =============================================================================

export default function OpxPage() {
  const { toast } = useToast();
  const [opportunities, setOpportunities] = useState<OpxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    minScore: 0,
    type: 'all',
    status: 'all',
  });

  // Load mock data on mount
  useEffect(() => {
    // Simulate API call
    const loadData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

      // TODO_REPLACE_WITH_REAL_DATA: Replace with actual API call
      // const response = await fetch('/api/opx/opportunities');
      // const data = await response.json();

      const mockData = generateMockOpportunities(15);
      setOpportunities(mockData);
      setLoading(false);
    };

    loadData();
  }, []);

  // Filter opportunities
  const filteredOpportunities = opportunities.filter(opp => {
    if (opp.score < filters.minScore) return false;
    if (filters.type !== 'all' && opp.type !== filters.type) return false;
    if (filters.status !== 'all' && opp.status !== filters.status) return false;
    return true;
  });

  // Stats
  const stats = {
    total: opportunities.length,
    proposed: opportunities.filter(o => o.status === 'proposed').length,
    approved: opportunities.filter(o => o.status === 'approved').length,
    rejected: opportunities.filter(o => o.status === 'rejected').length,
    avgScore:
      opportunities.length > 0
        ? Math.round(
            opportunities.reduce((sum, o) => sum + o.score, 0) /
              opportunities.length
          )
        : 0,
  };

  // Handle approval/rejection
  const handleAction = async (
    id: string,
    action: 'approve' | 'reject',
    note: string
  ): Promise<boolean> => {
    try {
      // TODO_REPLACE_WITH_REAL_DATA: Replace with actual API call
      // const response = await fetch(`/api/opx/opportunities/${id}/${action}`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ note }),
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));

      // Update local state
      setOpportunities(prev =>
        prev.map(opp =>
          opp.id === id
            ? { ...opp, status: action === 'approve' ? 'approved' : 'rejected' }
            : opp
        )
      );

      toast({
        title: `Opportunity ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        description: `${id} has been ${action === 'approve' ? 'approved' : 'rejected'}.`,
      });

      return true;
    } catch (error) {
      console.error('Action failed:', error);
      toast({
        title: 'Action Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
      return false;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            OPX - Operational Excellence
          </h1>
          <p className="text-muted-foreground mt-1">
            Agent-proposed opportunities triage and approval workflow
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Mock Data Mode
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Proposed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.proposed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejected}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgScore}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>
            Filter opportunities by score, type, and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Min Score: {filters.minScore}
              </label>
              <Slider
                value={[filters.minScore]}
                onValueChange={value =>
                  setFilters(prev => ({ ...prev, minScore: value[0] }))
                }
                max={100}
                step={5}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select
                value={filters.type}
                onValueChange={value =>
                  setFilters(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="beta">Beta</SelectItem>
                  <SelectItem value="basis">Basis</SelectItem>
                  <SelectItem value="realYield">Real Yield</SelectItem>
                  <SelectItem value="arb">Arbitrage</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={filters.status}
                onValueChange={value =>
                  setFilters(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="proposed">Proposed</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Opportunities Table */}
      <Card>
        <CardHeader>
          <CardTitle>Opportunities ({filteredOpportunities.length})</CardTitle>
          <CardDescription>
            Review and approve/reject agent-proposed opportunities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OpxTriageTable
            data={filteredOpportunities}
            loading={loading}
            onAction={handleAction}
            onToast={(message, isError) => {
              toast({
                title: isError ? 'Error' : 'Success',
                description: message,
                variant: isError ? 'destructive' : 'default',
              });
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
