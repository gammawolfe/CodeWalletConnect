import { Router } from 'express';
import { db } from './db';

const router = Router();

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: { status: 'up' | 'down'; latency?: number; error?: string };
    memory: { status: 'ok' | 'high'; usage: number; limit: number };
    disk: { status: 'ok' | 'full'; usage: number };
  };
}

// Basic health endpoint (minimal overhead)
router.get('/health', async (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Detailed health endpoint (for monitoring systems)
router.get('/health/detailed', async (req, res) => {
  const healthCheck: HealthCheckResult = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: Math.floor(process.uptime()),
    checks: {
      database: { status: 'down' },
      memory: { status: 'ok', usage: 0, limit: 0 },
      disk: { status: 'ok', usage: 0 }
    }
  };

  try {
    // Database health check
    const dbStartTime = Date.now();
    await db.execute('SELECT 1');
    const dbLatency = Date.now() - dbStartTime;
    
    healthCheck.checks.database = {
      status: 'up',
      latency: dbLatency
    };
  } catch (error) {
    healthCheck.status = 'unhealthy';
    healthCheck.checks.database = {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown database error'
    };
  }

  // Memory health check
  const memUsage = process.memoryUsage();
  const totalMemory = memUsage.heapTotal;
  const usedMemory = memUsage.heapUsed;
  const memoryUsagePercent = (usedMemory / totalMemory) * 100;

  healthCheck.checks.memory = {
    status: memoryUsagePercent > 90 ? 'high' : 'ok',
    usage: Math.round(usedMemory / 1024 / 1024), // MB
    limit: Math.round(totalMemory / 1024 / 1024)  // MB
  };

  if (memoryUsagePercent > 95) {
    healthCheck.status = 'unhealthy';
  }

  // Disk space check (if available)
  try {
    const fs = require('fs');
    const stats = fs.statSync('.');
    // This is a simplified check - in production you'd want proper disk monitoring
    healthCheck.checks.disk = {
      status: 'ok',
      usage: 0 // Would implement actual disk usage check
    };
  } catch (error) {
    // Ignore disk check errors in development
  }

  const statusCode = healthCheck.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(healthCheck);
});

// Readiness probe (for Kubernetes)
router.get('/ready', async (req, res) => {
  try {
    // Check if application is ready to serve requests
    await db.execute('SELECT 1');
    
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Service not ready'
    });
  }
});

// Liveness probe (for Kubernetes)
router.get('/live', (req, res) => {
  // Simple liveness check - if the process is running, it's alive
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    pid: process.pid,
    uptime: Math.floor(process.uptime())
  });
});

// Metrics endpoint (for Prometheus/monitoring)
router.get('/metrics', async (req, res) => {
  const memUsage = process.memoryUsage();
  
  const metrics = [
    `# HELP payflow_uptime_seconds Total uptime in seconds`,
    `# TYPE payflow_uptime_seconds counter`,
    `payflow_uptime_seconds ${Math.floor(process.uptime())}`,
    ``,
    `# HELP payflow_memory_usage_bytes Memory usage in bytes`,
    `# TYPE payflow_memory_usage_bytes gauge`,
    `payflow_memory_usage_bytes{type="heap_used"} ${memUsage.heapUsed}`,
    `payflow_memory_usage_bytes{type="heap_total"} ${memUsage.heapTotal}`,
    `payflow_memory_usage_bytes{type="rss"} ${memUsage.rss}`,
    ``,
    `# HELP nodejs_version_info Node.js version info`,
    `# TYPE nodejs_version_info gauge`,
    `nodejs_version_info{version="${process.version}"} 1`,
    ``
  ].join('\n');

  res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.send(metrics);
});

export { router as healthRouter };