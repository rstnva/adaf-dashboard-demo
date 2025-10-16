import type { Feed, Signal } from './types';

export interface OracleClientOptions {
  baseUrl: string;
  token?: string;
}

export class OracleHttpError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export class OracleClient {
  private readonly baseUrl: string;
  private readonly token?: string;

  constructor(options: OracleClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.token = options.token;
  }

  private headers(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    return headers;
  }

  private async handle<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const message = await response.text();
      throw new OracleHttpError(message || 'Oracle request failed', response.status);
    }

    return response.json() as Promise<T>;
  }

  async listFeeds(): Promise<{ feeds: Feed[] }> {
    const response = await fetch(`${this.baseUrl}/api/oracle/v1/feeds`, {
      headers: this.headers(),
    });
    return this.handle(response);
  }

  async getLatest(feedId: string): Promise<Signal> {
    const response = await fetch(`${this.baseUrl}/api/oracle/v1/feeds/${feedId}/latest`, {
      headers: this.headers(),
    });
    return this.handle(response);
  }

  async query(params: {
    feedIds: string[];
    since?: string;
    until?: string;
    agg?: 'mean' | 'median';
  }): Promise<Record<string, Signal[]>> {
    const response = await fetch(`${this.baseUrl}/api/oracle/v1/query`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(params),
    });
    return this.handle(response);
  }

  async publish(feedId: string, signal: Signal): Promise<{ ok: boolean; rev: number }> {
    const response = await fetch(`${this.baseUrl}/api/oracle/v1/publish`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ ...signal, feedId }),
    });
    return this.handle(response);
  }

  subscribe(feedId: string, cb: (_signal: Signal) => void): () => void {
    const url = new URL(`${this.baseUrl.replace(/^http/, 'ws')}/api/oracle/v1/subscribe`);
    url.searchParams.set('feedId', feedId);

    const socket = new WebSocket(url.toString());
    socket.addEventListener('message', event => {
      try {
        const signal = JSON.parse(event.data) as Signal;
        cb(signal);
      } catch (error) {
        console.error('oracle-sdk: failed to parse message', error);
      }
    });

    return () => {
      socket.close();
    };
  }
}
