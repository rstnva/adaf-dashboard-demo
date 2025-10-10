// Fortune 500-grade: ioredis mock for Vitest
class MockRedis {
  private store: Record<string, string> = {};
  async get(key: string) { return this.store[key] || null; }
  async set(key: string, value: string) { this.store[key] = value; return 'OK'; }
  async del(key: string) { delete this.store[key]; return 1; }
  async flushdb() { this.store = {}; return 'OK'; }
  async keys(pattern: string) { return Object.keys(this.store); }
}
export default MockRedis;
