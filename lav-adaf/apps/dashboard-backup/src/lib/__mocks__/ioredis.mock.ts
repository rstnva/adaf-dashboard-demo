// Fortune 500-grade: Minimal ioredis mock for ADAF Dashboard Pro
export default class MockRedis {
  private store: Record<string, any> = {};
  async set(key: string, value: any) { this.store[key] = value; return 'OK'; }
  async get(key: string) { return this.store[key] ?? null; }
  async del(key: string) { delete this.store[key]; return 1; }
  async flushdb() { this.store = {}; return 'OK'; }
  async exists(key: string) { return this.store[key] !== undefined ? 1 : 0; }
  async keys(pattern: string) { return Object.keys(this.store); }
  async quit() { return 'OK'; }
  // Add more methods as needed for tests
}
