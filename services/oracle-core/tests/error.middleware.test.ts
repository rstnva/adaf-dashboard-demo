import { describe, it, expect } from 'vitest';
import { ZodError } from 'zod';
import { toApiError } from '../serve/api/error.middleware';

describe('toApiError', () => {
  it('maps ZodError to VALIDATION_ERROR', () => {
    const err = new ZodError([{ code: 'custom', message: 'Invalid', path: [] }]);
    const apiErr = toApiError(err);
    expect(apiErr.status).toBe(400);
    expect(apiErr.code).toBe('VALIDATION_ERROR');
  });

  it('maps not found error', () => {
    const err = { code: 'NOT_FOUND' };
    const apiErr = toApiError(err);
    expect(apiErr.status).toBe(404);
    expect(apiErr.code).toBe('NOT_FOUND');
  });

  it('maps unprocessable error', () => {
    const err = { code: 'UNPROCESSABLE' };
    const apiErr = toApiError(err);
    expect(apiErr.status).toBe(422);
    expect(apiErr.code).toBe('UNPROCESSABLE');
  });

  it('maps rate limit error', () => {
    const err = { code: 'RATE_LIMITED' };
    const apiErr = toApiError(err);
    expect(apiErr.status).toBe(429);
    expect(apiErr.code).toBe('RATE_LIMITED');
  });

  it('maps service unavailable error', () => {
    const err = { code: 'SERVICE_UNAVAILABLE' };
    const apiErr = toApiError(err);
    expect(apiErr.status).toBe(503);
    expect(apiErr.code).toBe('SERVICE_UNAVAILABLE');
  });

  it('maps default error', () => {
    const err = { code: 'UNKNOWN' };
    const apiErr = toApiError(err);
    expect(apiErr.status).toBe(500);
    expect(apiErr.code).toBe('INTERNAL_ERROR');
  });

  it('maps generic error', () => {
    const err = new Error('fail');
    const apiErr = toApiError(err);
    expect(apiErr.status).toBe(500);
    expect(apiErr.code).toBe('INTERNAL_ERROR');
  });
});
