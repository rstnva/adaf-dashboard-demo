/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unused-vars */
// Mock Prisma client for build compatibility

// Fortune 500-grade: Robust Prisma mock for ESM/CJS compatibility
// Exports: PrismaClient, Prisma, default: PrismaClient (no __esModule)
// Forcibly sets module.exports for CJS
export interface MockPrismaModel {
  findMany: (args?: any) => Promise<any[]>;
  findUnique: (args?: any) => Promise<any>;
  create: (args?: any) => Promise<any>;
  update: (args?: any) => Promise<any>;
  delete: (args?: any) => Promise<any>;
  count: (args?: any) => Promise<number>;
  deleteMany?: (args?: any) => Promise<any>;
}

const makeMockModel = () => ({
  findMany: async () => [],
  findUnique: async () => null,
  create: async (args: any) => ({ id: 'mock', ...args?.data }),
  update: async (args: any) => ({ id: 'mock', ...args?.data }),
  delete: async () => ({ id: 'mock' }),
  count: async () => 0,
});

// In-memory arrays for signals and news data
const _signals: any[] = [];
const _newsData: any[] = [];
let newsCounter = 0;

const newsDataModel: MockPrismaModel = {
  findMany: async (args?: any) => {
    if (!args?.where) {
      return [..._newsData];
    }
    return _newsData.filter(entry =>
      Object.entries(args.where).every(([key, value]) => entry[key] === value)
    );
  },
  findUnique: async (args?: any) => {
    if (!args?.where) {
      return null;
    }
    return (
      _newsData.find(entry =>
        Object.entries(args.where).every(([key, value]) => entry[key] === value)
      ) ?? null
    );
  },
  create: async (args: any) => {
    const entry = {
      id: `news-${++newsCounter}`,
      ...args?.data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    _newsData.push(entry);
    return entry;
  },
  update: async (args: any) => {
    if (!args?.where) {
      return null;
    }
    const index = _newsData.findIndex(entry =>
      Object.entries(args.where).every(([key, value]) => entry[key] === value)
    );
    if (index === -1) {
      return null;
    }
    _newsData[index] = {
      ..._newsData[index],
      ...args.data,
      updatedAt: new Date().toISOString(),
    };
    return _newsData[index];
  },
  delete: async (args: any) => {
    if (!args?.where) {
      return null;
    }
    const index = _newsData.findIndex(entry =>
      Object.entries(args.where).every(([key, value]) => entry[key] === value)
    );
    if (index === -1) {
      return null;
    }
    const [removed] = _newsData.splice(index, 1);
    return removed;
  },
  count: async () => _newsData.length,
  deleteMany: async () => {
    const count = _newsData.length;
    _newsData.length = 0;
    return { count };
  },
};
const signalModel: MockPrismaModel = {
  findMany: async (args?: any) => {
    if (!args || !args.where) return [..._signals];
    // Simple where filter (equality only)
    return _signals.filter(sig =>
      Object.entries(args.where).every(([k, v]) => sig[k] === v)
    );
  },
  findUnique: async (args?: any) => {
    if (!args || !args.where) return null;
    return (
      _signals.find(sig =>
        Object.entries(args.where).every(([k, v]) => sig[k] === v)
      ) || null
    );
  },
  create: async (args: any) => {
    const obj = { id: 'mock-' + (_signals.length + 1), ...args?.data };
    _signals.push(obj);
    return obj;
  },
  update: async (args: any) => {
    if (!args?.where) return null;
    const idx = _signals.findIndex(sig =>
      Object.entries(args.where).every(([k, v]) => sig[k] === v)
    );
    if (idx === -1) return null;
    _signals[idx] = { ..._signals[idx], ...args.data };
    return _signals[idx];
  },
  delete: async (args: any) => {
    if (!args?.where) return null;
    const idx = _signals.findIndex(sig =>
      Object.entries(args.where).every(([k, v]) => sig[k] === v)
    );
    if (idx === -1) return null;
    const [removed] = _signals.splice(idx, 1);
    return removed;
  },
  count: async () => _signals.length,
};

export class PrismaClient {
  alert: MockPrismaModel;
  user: MockPrismaModel;
  opportunity: MockPrismaModel;
  rule: MockPrismaModel;
  limit: MockPrismaModel;
  key: MockPrismaModel;
  compliance: MockPrismaModel;
  checklist: MockPrismaModel;
  score: MockPrismaModel;
  funding: MockPrismaModel;
  signal: MockPrismaModel;
  newsData: MockPrismaModel;

  constructor() {
    this.alert = makeMockModel();
    this.user = makeMockModel();
    this.opportunity = makeMockModel();
    this.rule = makeMockModel();
    this.limit = makeMockModel();
    this.key = makeMockModel();
    this.compliance = makeMockModel();
    this.checklist = makeMockModel();
    this.score = makeMockModel();
    this.funding = makeMockModel();
    this.signal = signalModel;
    this.newsData = newsDataModel;
    console.log('Mock Prisma Client initialized');
  }

  $disconnect = async () => {};
  $connect = async () => {};
  $queryRawUnsafe = async (..._args: any[]) => [];
  $queryRaw = async (..._args: any[]) => [];
}

export const Prisma = {
  SortOrder: {
    asc: 'asc',
    desc: 'desc',
  },
};

export default PrismaClient;

// Fortune 500: Forcibly set all possible CJS/ESM export styles and remove __esModule
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PrismaClient, Prisma, default: PrismaClient };
  // Remove __esModule if present
  if (module.exports.__esModule) delete module.exports.__esModule;
}
// Also patch global exports for Vitest ESM/CJS interop
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
if (typeof exports !== 'undefined') {
  exports.PrismaClient = PrismaClient;
  exports.Prisma = Prisma;
  exports.default = PrismaClient;
  if (exports.__esModule) delete exports.__esModule;
}
// Runtime log to confirm mock is used
console.log('[MOCK-PRISMA] LAV Prisma mock loaded');
