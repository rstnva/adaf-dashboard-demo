import { ZodError } from 'zod';
import { randomUUID } from 'crypto';

export function toApiError(e: unknown): { status: number; code: string; message: string } {
  if (e instanceof ZodError) {
    return { status: 400, code: 'VALIDATION_ERROR', message: e.errors?.[0]?.message || 'Validation failed' };
  }
  if (e && typeof e === 'object') {
    if ('code' in e && e.code === 'NOT_FOUND') {
      return { status: 404, code: 'NOT_FOUND', message: 'Resource not found' };
    }
    if ('code' in e && e.code === 'UNPROCESSABLE') {
      return { status: 422, code: 'UNPROCESSABLE', message: 'Unprocessable entity' };
    }
    if ('code' in e && e.code === 'RATE_LIMITED') {
      return { status: 429, code: 'RATE_LIMITED', message: 'Rate limit exceeded' };
    }
    if ('code' in e && e.code === 'SERVICE_UNAVAILABLE') {
      return { status: 503, code: 'SERVICE_UNAVAILABLE', message: 'Service unavailable' };
    }
  }
  return { status: 500, code: 'INTERNAL_ERROR', message: 'Internal server error' };
}

export function withJsonError(handler: (req: any, res: any) => Promise<any> | any) {
  return async function (req: any, res: any) {
    try {
      return await handler(req, res);
    } catch (e) {
      const trace_id = randomUUID();
      const apiError = toApiError(e);
      res.status(apiError.status);
      res.setHeader('X-Trace-Id', trace_id);
      res.setHeader('X-Error-Code', apiError.code);
      res.json({
        error: { code: apiError.code, message: apiError.message },
        trace_id,
        path: req.url,
        ts: Date.now()
      });
    }
  };
}
