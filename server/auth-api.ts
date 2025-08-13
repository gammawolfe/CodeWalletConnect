import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { apiKeysRepository, partnersRepository, walletsRepository } from './repositories';
import type { Partner, ApiKey } from '@shared/schema';

// Extend Express Request to include partner info
declare global {
  namespace Express {
    interface Request {
      partner?: Partner;
      apiKey?: ApiKey;
    }
  }
}

/**
 * Generate API key pair (public and secret)
 */
export function generateApiKeyPair(partnerId: string, environment: 'sandbox' | 'production') {
  const prefix = environment === 'production' ? 'pk_live' : 'pk_test';
  const secretPrefix = environment === 'production' ? 'sk_live' : 'sk_test';
  
  // Generate random bytes for key
  const keyBytes = crypto.randomBytes(24);
  const publicKey = `${prefix}_${partnerId.slice(0, 8)}_${keyBytes.toString('hex')}`;
  const secretKey = `${secretPrefix}_${partnerId.slice(0, 8)}_${crypto.randomBytes(32).toString('hex')}`;
  
  // Hash the secret key for storage
  const keyHash = crypto
    .createHash('sha256')
    .update(secretKey)
    .digest('hex');
  
  return {
    publicKey,
    secretKey,
    keyHash
  };
}

/**
 * Hash API key for comparison
 */
export function hashApiKey(apiKey: string): string {
  return crypto
    .createHash('sha256')
    .update(apiKey)
    .digest('hex');
}

/**
 * Middleware to authenticate API requests using API keys
 */
export async function requireApiKey(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Missing or invalid authorization header. Use: Authorization: Bearer sk_xxx' 
      });
    }
    
    const apiKey = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!apiKey.startsWith('sk_')) {
      return res.status(401).json({ 
        error: 'Invalid API key format. Must start with sk_test_ or sk_live_' 
      });
    }
    
    // Hash the provided key to compare with stored hash
    const keyHash = hashApiKey(apiKey);
    
    // Look up the API key in database
    const storedApiKey = await apiKeysRepository.getByHash(keyHash);
    
    if (!storedApiKey || !storedApiKey.isActive) {
      return res.status(401).json({ 
        error: 'Invalid or inactive API key' 
      });
    }
    
    // Check if key has expired
    if (storedApiKey.expiresAt && new Date() > storedApiKey.expiresAt) {
      return res.status(401).json({ 
        error: 'API key has expired' 
      });
    }
    
    // Get the partner associated with this API key
    const partner = await partnersRepository.getById(storedApiKey.partnerId);
    
    if (!partner || partner.status !== 'approved') {
      return res.status(401).json({ 
        error: 'Partner account not approved or suspended' 
      });
    }
    
    // Update last used timestamp
    await apiKeysRepository.touchLastUsed(storedApiKey.id);
    
    // Attach partner and API key info to request
    req.partner = partner;
    req.apiKey = storedApiKey;
    
    next();
  } catch (error) {
    console.error('API key authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Check if API key has specific permission
 */
export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.apiKey || !req.apiKey.permissions.includes(permission)) {
      return res.status(403).json({ 
        error: `Insufficient permissions. Required: ${permission}` 
      });
    }
    next();
  };
}

/**
 * Check if API key environment matches required environment
 */
export function requireEnvironment(environment: 'sandbox' | 'production') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.apiKey || req.apiKey.environment !== environment) {
      return res.status(403).json({ 
        error: `This endpoint requires ${environment} API key` 
      });
    }
    next();
  };
}

/**
 * Validate wallet ownership by partner
 */
export async function validateWalletOwnership(req: Request, res: Response, next: NextFunction) {
  try {
    const walletId = req.params.walletId || req.params.id;
    
    if (!walletId) {
      return res.status(400).json({ error: 'Wallet ID is required' });
    }
    
    const wallet = await walletsRepository.getById(walletId);
    
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }
    
    if (!req.partner || wallet.partnerId !== req.partner.id) {
      return res.status(403).json({ error: 'Wallet does not belong to your organization' });
    }
    
    // Attach wallet to request for convenience
    (req as any).wallet = wallet;
    
    next();
  } catch (error) {
    console.error('Wallet ownership validation error:', error);
    res.status(500).json({ error: 'Validation failed' });
  }
}

/**
 * Rate limiting for API keys (simple in-memory implementation)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(requestsPerMinute: number = parseInt(process.env.RATE_LIMIT_RPM || '1000', 10)) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.apiKey) {
      return next(); // Skip rate limiting if no API key
    }
    
    const keyId = req.apiKey.id;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    
    const record = rateLimitStore.get(keyId) || { count: 0, resetTime: now + windowMs };
    
    if (now > record.resetTime) {
      // Reset the window
      record.count = 0;
      record.resetTime = now + windowMs;
    }
    
    record.count++;
    rateLimitStore.set(keyId, record);
    
    if (record.count > requestsPerMinute) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded',
        limit: requestsPerMinute,
        remaining: 0,
        resetTime: record.resetTime
      });
    }
    
    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': requestsPerMinute.toString(),
      'X-RateLimit-Remaining': Math.max(0, requestsPerMinute - record.count).toString(),
      'X-RateLimit-Reset': Math.ceil(record.resetTime / 1000).toString()
    });
    
    next();
  };
}