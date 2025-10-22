/*
  Database Mutation Helpers (Mock-First)
  
  - Prisma mutation wrappers for common operations
  - Mock implementations for development
  - Ready for real DB integration
  - TODO_REPLACE_WITH_REAL_DATA: Replace with actual Prisma client calls
*/

import type { PrismaClient } from '@prisma/client';

// Mock Prisma client for development
let mockPrisma: any = null;

function getPrismaClient(): any {
  // TODO_REPLACE_WITH_REAL_DATA: Return real Prisma client
  if (!mockPrisma) {
    mockPrisma = {
      backtestResult: {
        create: async (data: any) => ({
          id: `mock-${Date.now()}`,
          ...data.data,
        }),
        findMany: async () => [],
      },
      agentSignal: {
        create: async (data: any) => ({
          id: `mock-${Date.now()}`,
          ...data.data,
        }),
        updateMany: async () => ({ count: 0 }),
      },
      opportunity: {
        create: async (data: any) => ({
          id: `mock-${Date.now()}`,
          ...data.data,
          ideaType: data.data.ideaType,
        }),
        update: async () => ({ id: 'mock-1' }),
      },
    };
  }
  return mockPrisma;
}

// Backtest result insertion
export interface BacktestResultInput {
  strategyId: string;
  startDate: Date;
  endDate: Date;
  sharpeRatio: number;
  maxDrawdown: number;
  totalReturn: number;
  winRate: number;
  metadata?: Record<string, unknown>;
}

export async function insertBacktestResult(data: BacktestResultInput) {
  const prisma = getPrismaClient();
  // TODO_REPLACE_WITH_REAL_DATA: Use real Prisma schema
  return prisma.backtestResult.create({
    data: {
      strategyId: data.strategyId,
      startDate: data.startDate,
      endDate: data.endDate,
      metrics: {
        sharpeRatio: data.sharpeRatio,
        maxDrawdown: data.maxDrawdown,
        totalReturn: data.totalReturn,
        winRate: data.winRate,
      },
      metadata: (data.metadata as any) || {},
      createdAt: new Date(),
    },
  });
}

// Agent signal persistence
export interface AgentSignalInput {
  agentId: string;
  type: 'news' | 'onchain' | 'sentiment' | 'arbitrage';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, unknown>;
  fingerprint: string;
}

export async function insertAgentSignal(data: AgentSignalInput) {
  const prisma = getPrismaClient();
  // TODO_REPLACE_WITH_REAL_DATA: Use real Prisma schema
  return prisma.agentSignal.create({
    data: {
      source: data.agentId,
      type: data.type,
      title: data.title,
      description: data.description,
      severity: data.severity,
      metadata: (data.metadata as any) || {},
      fingerprint: data.fingerprint,
      processed: false,
      timestamp: new Date(),
    },
  });
}

// Mark signals as processed
export async function markSignalsProcessed(signalIds: string[]) {
  const prisma = getPrismaClient();
  // TODO_REPLACE_WITH_REAL_DATA: Use real Prisma schema
  return prisma.agentSignal.updateMany({
    where: { id: { in: signalIds } },
    data: { processed: true },
  });
}

// Opportunity tracking
export interface OpportunityInput {
  ideaType: string;
  title: string;
  description: string;
  score: number;
  agent: string;
  status: 'proposed' | 'approved' | 'rejected';
  metadata?: Record<string, unknown>;
}

export async function insertOpportunity(data: OpportunityInput) {
  const prisma = getPrismaClient();
  // TODO_REPLACE_WITH_REAL_DATA: Use real Prisma schema
  return prisma.opportunity.create({
    data: {
      ideaType: data.ideaType,
      title: data.title,
      description: data.description,
      score: data.score,
      agent: data.agent,
      status: data.status,
      metadata: (data.metadata as any) || {},
      createdAt: new Date(),
    },
  });
}

export async function updateOpportunityStatus(
  id: string,
  status: 'approved' | 'rejected'
) {
  const prisma = getPrismaClient();
  // TODO_REPLACE_WITH_REAL_DATA: Use real Prisma schema
  return prisma.opportunity.update({
    where: { id },
    data: { status, updatedAt: new Date() },
  });
}

// Get recent backtest results
export async function getRecentBacktestResults(limit = 10) {
  const prisma = getPrismaClient();
  // TODO_REPLACE_WITH_REAL_DATA: Use real Prisma schema
  return prisma.backtestResult.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
  });
}
