// Mock Prisma client for build compatibility

export interface MockPrismaModel {
  findMany: (args?: any) => Promise<any[]>;
  findUnique: (args?: any) => Promise<any>;
  create: (args?: any) => Promise<any>;
  update: (args?: any) => Promise<any>;
  delete: (args?: any) => Promise<any>;
  count: (args?: any) => Promise<number>;
}

const mockModel: MockPrismaModel = {
  findMany: async () => [],
  findUnique: async () => null,
  create: async (args: any) => ({ id: 'mock', ...args?.data }),
  update: async (args: any) => ({ id: 'mock', ...args?.data }),
  delete: async () => ({ id: 'mock' }),
  count: async () => 0,
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