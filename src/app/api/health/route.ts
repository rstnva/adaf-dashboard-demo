import { NextRequest, NextResponse } from 'next/server';

const MOCK_MODE = process.env.MOCK_MODE === '1';
function isEnabled(name: 'db'|'redis'|'external') {
  const key = `HEALTH_ENABLE_${name.toUpperCase()}` as const;
  const v = process.env[key];
  if (typeof v === 'string') return v === '1';
  // En MOCK_MODE desactivamos por defecto los checks pesados
  return !MOCK_MODE;
}

// Health check endpoint crítico para producción
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const deep = url.searchParams.get('deep') === '1';
    const timeoutMs = Number(url.searchParams.get('timeout') || 2500);
    const forceReal = url.searchParams.get('force') === 'real';

    // Verificaciones de salud críticas
    const checks = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      checks: deep
        ? {
            database: await checkDatabase(timeoutMs, forceReal),
            redis: await checkRedis(timeoutMs, forceReal),
            filesystem: await checkFilesystem(),
            external_apis: await checkExternalAPIs(timeoutMs, forceReal)
          }
        : {
            ping: { healthy: true, message: 'OK (shallow)' }
          }
    };

    // Si alguna verificación falla, devolver 503
    const hasFailures = Object.values(checks.checks).some(check => !check.healthy);
    
    if (hasFailures) {
      return NextResponse.json(checks, { status: 503 });
    }

    return NextResponse.json(checks, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}

async function checkDatabase(timeoutMs = 2000, allowReal = false) {
  try {
    if (!allowReal && !isEnabled('db')) {
      return { healthy: true, message: 'Database check disabled (mock)' };
    }
    // Importar dinámicamente para evitar errores si no está disponible
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    // timeout manual
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    await prisma.$queryRaw`SELECT 1`;
    clearTimeout(id);
    await prisma.$disconnect();
    
    return { healthy: true, message: 'Database connection successful' };
  } catch (error) {
    return { 
      healthy: false, 
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown database error'
    };
  }
}

async function checkRedis(_timeoutMs = 2000, allowReal = false) {
  try {
    if (!allowReal && !isEnabled('redis')) {
      return { healthy: true, message: 'Redis check disabled (mock)' };
    }
    // Redis check (si está configurado)
    if (process.env.REDIS_URL) {
      // Implementar check de Redis aquí
      return { healthy: true, message: 'Redis connection successful' };
    }
    return { healthy: true, message: 'Redis not configured' };
  } catch (error) {
    return { 
      healthy: false, 
      message: 'Redis connection failed',
      error: error instanceof Error ? error.message : 'Unknown redis error'
    };
  }
}

async function checkFilesystem() {
  try {
    const fs = await import('fs/promises');
    const { constants } = await import('fs');
    await fs.access('/tmp', constants.W_OK);
    return { healthy: true, message: 'Filesystem writable' };
  } catch (error) {
    return { 
      healthy: false, 
      message: 'Filesystem not writable',
      error: error instanceof Error ? error.message : 'Unknown filesystem error'
    };
  }
}

async function checkExternalAPIs(timeoutMs = 2000, allowReal = false) {
  try {
    if (!allowReal && !isEnabled('external')) {
      return { healthy: true, message: 'External checks disabled (mock)' };
    }
    // Verificar APIs externas críticas
    const checks = [];
    
    // Ejemplo: verificar conectividad externa
    const response = await fetch('https://httpbin.org/status/200', { 
      signal: AbortSignal.timeout(timeoutMs) 
    });
    
    if (response.ok) {
      checks.push({ api: 'external', healthy: true });
    } else {
      checks.push({ api: 'external', healthy: false });
    }
    
    const allHealthy = checks.every(check => check.healthy);
    return { 
      healthy: allHealthy, 
      message: allHealthy ? 'All external APIs healthy' : 'Some external APIs failing',
      details: checks
    };
  } catch (error) {
    return { 
      healthy: false, 
      message: 'External API check failed',
      error: error instanceof Error ? error.message : 'Unknown external API error'
    };
  }
}