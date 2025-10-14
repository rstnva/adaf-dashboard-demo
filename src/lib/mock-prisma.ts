// Mock Prisma client for build compatibility

export interface MockPrismaModel {
  findMany: (_args?: any) => Promise<any[]>;
  findUnique: (_args?: any) => Promise<any>;
  create: (_args?: any) => Promise<any>;
  update: (_args?: any) => Promise<any>;
  delete: (_args?: any) => Promise<any>;
  count: (_args?: any) => Promise<number>;
}

const mockModel: MockPrismaModel = {
  findMany: async _args => [],
  findUnique: async _args => null,
  create: async (args: any) => ({ id: 'mock', ...args?.data }),
  update: async (args: any) => ({ id: 'mock', ...args?.data }),
  delete: async _args => ({ id: 'mock' }),
  count: async _args => 0,
};

export class PrismaClient {
  alert = mockModel;
  user = mockModel;
  opportunity = mockModel;
  rule = mockModel;
  limit = mockModel;
  key = mockModel;
  compliance = mockModel;
  checklist = mockModel;
  score = mockModel;
  funding = mockModel;

  constructor() {
    console.log('Mock Prisma Client initialized');
  }

  $disconnect = async () => {};
  $connect = async () => {};
}

export const Prisma = {
  SortOrder: {
    asc: 'asc',
    desc: 'desc',
  },
};

export default PrismaClient;
