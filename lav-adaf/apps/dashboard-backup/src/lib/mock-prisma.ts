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
}


const makeMockModel = () => ({
  findMany: async () => [],
  findUnique: async () => null,
  create: async (args: any) => ({ id: 'mock', ...args?.data }),
  update: async (args: any) => ({ id: 'mock', ...args?.data }),
  delete: async () => ({ id: 'mock' }),
  count: async () => 0,
});

// In-memory array for signals
const _signals: any[] = [];
const signalModel: MockPrismaModel = {
  findMany: async (args?: any) => {
    if (!args || !args.where) return [..._signals];
    // Simple where filter (equality only)
    return _signals.filter(sig => Object.entries(args.where).every(([k, v]) => sig[k] === v));
  },
  findUnique: async (args?: any) => {
    if (!args || !args.where) return null;
    return _signals.find(sig => Object.entries(args.where).every(([k, v]) => sig[k] === v)) || null;
  },
  create: async (args: any) => {
    const obj = { id: 'mock-' + (_signals.length + 1), ...args?.data };
    _signals.push(obj);
    return obj;
  },
  update: async (args: any) => {
    if (!args?.where) return null;
    const idx = _signals.findIndex(sig => Object.entries(args.where).every(([k, v]) => sig[k] === v));
    if (idx === -1) return null;
    _signals[idx] = { ..._signals[idx], ...args.data };
    return _signals[idx];
  },
  delete: async (args: any) => {
    if (!args?.where) return null;
    const idx = _signals.findIndex(sig => Object.entries(args.where).every(([k, v]) => sig[k] === v));
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
    console.log('Mock Prisma Client initialized');
  }

  $disconnect = async () => {};
  $connect = async () => {};
  $queryRawUnsafe = async (...args: any[]) => [];
  $queryRaw = async (...args: any[]) => [];
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