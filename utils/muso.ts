// env MUSO_API_KEY

/**
 * Muso API Caching & Rate Limiting Implementation
 *
 * This module implements caching and rate limiting for Muso API calls to reduce API usage and prevent hitting rate limits.
 *
 * CACHING FEATURES:
 * - Uses Vercel KV (Redis) for persistent, shared caching across all serverless instances
 * - Caches profile data: 6 hours for successful requests only
 * - Automatic cache expiration with TTL (Time To Live)
 *
 * RATE LIMITING FEATURES:
 * - Per-user rate limiting: 10 requests per minute using KV store
 * - 429 status code with reset time when exceeded
 * - Persistent across serverless function instances
 *
 * Cache Keys:
 * - `muso:profile:${profileId}` - Stores full profile data including charts
 *
 * Rate Limit Keys:
 * - `muso:rate:${userId}` - Tracks requests per user per time window
 *
 * Note: This uses Vercel KV (Redis) for persistent storage that's shared across
 * all serverless function instances, solving the cache isolation problem.
 */

import { Redis } from '@upstash/redis';

// Generate a unique instance ID for this serverless function instance
const INSTANCE_ID = Math.random().toString(36).substring(2, 15);
const INSTANCE_START_TIME = Date.now();

console.log(
  `[MUSO_INSTANCE] NEW_INSTANCE: ${INSTANCE_ID} | Started: ${new Date().toISOString()}`
);

// Initialize Upstash Redis client
const redis = Redis.fromEnv();

// Cache configuration
const CACHE_CONFIG = {
  DEFAULT_TTL: 12 * 60 * 60, // 12 hours in seconds (Redis uses seconds)
  PROFILE_PREFIX: 'muso:profile:',
  RATE_LIMIT_PREFIX: 'muso:rate:'
};

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  WINDOW_SIZE: 60, // 1 minute window in seconds
  MAX_REQUESTS: 50 // 50 requests per minute per user
};

// Redis-based cache implementation
class MusoRedisCache {
  async set<T>(
    key: string,
    data: T,
    ttlSeconds: number = CACHE_CONFIG.DEFAULT_TTL
  ): Promise<void> {
    const timestamp = Date.now();
    const redisKey = `${CACHE_CONFIG.PROFILE_PREFIX}${key}`;

    try {
      await redis.setex(
        redisKey,
        ttlSeconds,
        JSON.stringify({
          data,
          timestamp
        })
      );

      console.log(
        `[MUSO_REDIS_CACHE] SET: ${key} | TTL: ${ttlSeconds / 60}min | Instance: ${INSTANCE_ID} | Timestamp: ${new Date(timestamp).toISOString()}`
      );
    } catch (error) {
      console.error(
        `[MUSO_REDIS_CACHE] SET_ERROR: ${key} | Instance: ${INSTANCE_ID} | Error:`,
        error
      );
      throw error;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const redisKey = `${CACHE_CONFIG.PROFILE_PREFIX}${key}`;

    try {
      const cached = await redis.get(redisKey);
      if (!cached) {
        console.log(
          `[MUSO_REDIS_CACHE] MISS: ${key} | Reason: Not found | Instance: ${INSTANCE_ID}`
        );
        return null;
      }

      // Handle both string (JSON) and object responses from Upstash Redis
      const parsedData =
        typeof cached === 'string' ? JSON.parse(cached) : cached;
      const { data, timestamp } = parsedData;
      const age = Date.now() - timestamp;

      // Better age display - show seconds if less than 1 minute
      const ageDisplay =
        age < 60000
          ? `${Math.round(age / 1000)}s`
          : `${Math.round(age / 1000 / 60)}min`;
      const freshness =
        age < 30000 ? '🔥 VERY FRESH' : age < 300000 ? '✨ FRESH' : '📦 CACHED';

      console.log(
        `[MUSO_REDIS_CACHE] HIT: ${key} | Age: ${ageDisplay} | ${freshness} | Instance: ${INSTANCE_ID} | 🌐 SHARED REDIS CACHE`
      );
      return data as T;
    } catch (error) {
      console.error(
        `[MUSO_REDIS_CACHE] GET_ERROR: ${key} | Instance: ${INSTANCE_ID} | Error:`,
        error
      );
      return null;
    }
  }

  async clear(): Promise<void> {
    try {
      // Note: This is a simplified clear - in production you might want to scan and delete by pattern
      console.log(
        `[MUSO_REDIS_CACHE] CLEAR: Clearing Redis cache | Instance: ${INSTANCE_ID}`
      );
      // Redis doesn't have a clear by pattern method, so we'd need to implement key scanning
      // For now, just log that clear was requested
    } catch (error) {
      console.error(
        `[MUSO_REDIS_CACHE] CLEAR_ERROR: Instance: ${INSTANCE_ID} | Error:`,
        error
      );
    }
  }
}

// Redis-based rate limiter
class MusoRedisRateLimiter {
  async isAllowed(userId: string): Promise<boolean> {
    const now = Math.floor(Date.now() / 1000); // Redis uses seconds
    const key = `${CACHE_CONFIG.RATE_LIMIT_PREFIX}${userId}`;

    try {
      const cached = await redis.get(key);

      if (!cached) {
        // First request from this user
        await redis.setex(
          key,
          RATE_LIMIT_CONFIG.WINDOW_SIZE,
          JSON.stringify({
            requests: 1,
            windowStart: now
          })
        );
        console.log(
          `[MUSO_REDIS_RATE_LIMIT] ALLOW: ${userId} | First request | 1/${RATE_LIMIT_CONFIG.MAX_REQUESTS} | Instance: ${INSTANCE_ID}`
        );
        return true;
      }

      // Handle both string (JSON) and object responses from Upstash Redis
      const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
      const { requests, windowStart } = data;

      // Check if we're in a new window
      if (now - windowStart >= RATE_LIMIT_CONFIG.WINDOW_SIZE) {
        // Reset window
        await redis.setex(
          key,
          RATE_LIMIT_CONFIG.WINDOW_SIZE,
          JSON.stringify({
            requests: 1,
            windowStart: now
          })
        );
        console.log(
          `[MUSO_REDIS_RATE_LIMIT] ALLOW: ${userId} | New window | 1/${RATE_LIMIT_CONFIG.MAX_REQUESTS} | Instance: ${INSTANCE_ID}`
        );
        return true;
      }

      // Check if under limit
      if (requests < RATE_LIMIT_CONFIG.MAX_REQUESTS) {
        await redis.setex(
          key,
          RATE_LIMIT_CONFIG.WINDOW_SIZE,
          JSON.stringify({
            requests: requests + 1,
            windowStart
          })
        );
        console.log(
          `[MUSO_REDIS_RATE_LIMIT] ALLOW: ${userId} | ${requests + 1}/${RATE_LIMIT_CONFIG.MAX_REQUESTS} | Window: ${now - windowStart}s | Instance: ${INSTANCE_ID}`
        );
        return true;
      }

      // Rate limit exceeded
      const resetIn = windowStart + RATE_LIMIT_CONFIG.WINDOW_SIZE - now;
      console.log(
        `[MUSO_REDIS_RATE_LIMIT] DENY: ${userId} | ${requests}/${RATE_LIMIT_CONFIG.MAX_REQUESTS} | Reset in: ${resetIn}s | Instance: ${INSTANCE_ID}`
      );
      return false;
    } catch (error) {
      console.error(
        `[MUSO_REDIS_RATE_LIMIT] ERROR: ${userId} | Instance: ${INSTANCE_ID} | Error:`,
        error
      );
      // If Redis fails, allow the request (fail open)
      return true;
    }
  }

  async getRemainingRequests(userId: string): Promise<number> {
    const now = Math.floor(Date.now() / 1000);
    const key = `${CACHE_CONFIG.RATE_LIMIT_PREFIX}${userId}`;

    try {
      const cached = await redis.get(key);

      if (!cached) {
        return RATE_LIMIT_CONFIG.MAX_REQUESTS;
      }

      // Handle both string (JSON) and object responses from Upstash Redis
      const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
      const { requests, windowStart } = data;

      if (now - windowStart >= RATE_LIMIT_CONFIG.WINDOW_SIZE) {
        return RATE_LIMIT_CONFIG.MAX_REQUESTS;
      }

      return Math.max(0, RATE_LIMIT_CONFIG.MAX_REQUESTS - requests);
    } catch (error) {
      console.error(
        `[MUSO_REDIS_RATE_LIMIT] GET_REMAINING_ERROR: ${userId} | Instance: ${INSTANCE_ID} | Error:`,
        error
      );
      return RATE_LIMIT_CONFIG.MAX_REQUESTS;
    }
  }

  async getResetTime(userId: string): Promise<number> {
    const key = `${CACHE_CONFIG.RATE_LIMIT_PREFIX}${userId}`;

    try {
      const cached = await redis.get(key);

      if (!cached) {
        return 0;
      }

      // Handle both string (JSON) and object responses from Upstash Redis
      const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
      const { windowStart } = data;
      return (windowStart + RATE_LIMIT_CONFIG.WINDOW_SIZE) * 1000; // Convert to milliseconds
    } catch (error) {
      console.error(
        `[MUSO_REDIS_RATE_LIMIT] GET_RESET_TIME_ERROR: ${userId} | Instance: ${INSTANCE_ID} | Error:`,
        error
      );
      return 0;
    }
  }
}

// Global Redis instances
const musoRedisCache = new MusoRedisCache();
const redisRateLimiter = new MusoRedisRateLimiter();

export async function getMusoProfileData(profileId: string) {
  const startTime = Date.now();

  console.log(
    `[MUSO_API] PROFILE_START: ${profileId} | Timestamp: ${new Date().toISOString()}`
  );

  // Check cache first
  const cachedData = await musoRedisCache.get<any>(profileId);
  if (cachedData !== null) {
    const duration = Date.now() - startTime;
    console.log(
      `[MUSO_API] PROFILE_CACHE_HIT: ${profileId} | Duration: ${duration}ms | Profile: ${cachedData.profile?.data?.name || 'N/A'} | 🚀 NO API CALL MADE - USING CACHE`
    );
    return cachedData;
  }

  console.log(
    `[MUSO_API] PROFILE_CACHE_MISS: ${profileId} | 🌐 CALLING MUSO API`
  );

  const apiKey = process.env.MUSO_API_KEY;
  const baseUrl = 'https://api.developer.muso.ai/v4';

  if (!apiKey) {
    console.error(`[MUSO_API] PROFILE_ERROR: ${profileId} | Missing API key`);
    throw new Error('MUSO_API_KEY environment variable not set');
  }

  const headers = {
    'x-api-key': apiKey,
    Accept: 'application/json'
  };

  const profileUrl = `${baseUrl}/profile/${profileId}/`;
  const chartsUrl = `${baseUrl}/profile/${profileId}/charts`;

  console.log(
    `[MUSO_API] PROFILE_FETCH: ${profileId} | URLs: [${profileUrl}, ${chartsUrl}] | 🌐 MAKING API CALLS`
  );

  try {
    const fetchStart = Date.now();
    const [profileResponse, chartsResponse] = await Promise.all([
      fetch(profileUrl, { headers }),
      fetch(chartsUrl, { headers })
    ]);
    const fetchDuration = Date.now() - fetchStart;

    console.log(
      `[MUSO_API] PROFILE_RESPONSES: ${profileId} | Profile: ${profileResponse.status} | Charts: ${chartsResponse.status} | Fetch: ${fetchDuration}ms | 🌐 API CALLS COMPLETE`
    );

    if (!profileResponse.ok) {
      const errorText = await profileResponse.text();
      console.error(
        `[MUSO_API] PROFILE_ERROR: ${profileId} | Profile fetch failed | Status: ${profileResponse.status} | Error: ${errorText} | 🌐 API CALL FAILED`
      );
      throw new Error(
        `Failed to fetch Muso profile data. Status: ${profileResponse.status}`
      );
    }

    if (!chartsResponse.ok) {
      const errorText = await chartsResponse.text();
      console.error(
        `[MUSO_API] PROFILE_ERROR: ${profileId} | Charts fetch failed | Status: ${chartsResponse.status} | Error: ${errorText} | 🌐 API CALL FAILED`
      );
      throw new Error(
        `Failed to fetch Muso chart data. Status: ${chartsResponse.status}`
      );
    }

    const parseStart = Date.now();
    const profileData = await profileResponse.json();
    const chartsData = await chartsResponse.json();
    const parseDuration = Date.now() - parseStart;

    const result = {
      profile: profileData,
      charts: chartsData
    };

    console.log(
      `[MUSO_API] PROFILE_PARSED: ${profileId} | Parse: ${parseDuration}ms | Profile: ${profileData.data?.name || 'N/A'} | Charts: ${chartsData.data?.length || 0} items | 🌐 API DATA PROCESSED`
    );

    // Cache the result
    await musoRedisCache.set(profileId, result);

    const totalDuration = Date.now() - startTime;
    console.log(
      `[MUSO_API] PROFILE_COMPLETE: ${profileId} | Total: ${totalDuration}ms | Cached for: ${CACHE_CONFIG.DEFAULT_TTL / 60}min | 🌐 API CALLS USED`
    );

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(
      `[MUSO_API] PROFILE_ERROR: ${profileId} | Duration: ${duration}ms | 🌐 API CALL FAILED | Error:`,
      error
    );
    // Re-throw the error to be handled by the caller
    throw error;
  }
}

export async function getMusoDataForUser(userId: string, supabaseClient: any) {
  const startTime = Date.now();
  console.log(
    `[MUSO_API] USER_DATA_START: ${userId} | Timestamp: ${new Date().toISOString()}`
  );

  try {
    // Fetch the user's muso_profile_id
    const dbStart = Date.now();
    const { data: userData, error: profileError } = await supabaseClient
      .from('users')
      .select('muso_profile_id')
      .eq('id', userId)
      .single();
    const dbDuration = Date.now() - dbStart;

    console.log(
      `[MUSO_API] USER_DB_QUERY: ${userId} | Duration: ${dbDuration}ms | Profile ID: ${userData?.muso_profile_id || 'null'}`
    );

    if (profileError) {
      console.error(
        `[MUSO_API] USER_DB_ERROR: ${userId} | Error:`,
        profileError
      );
      return null;
    }

    if (!userData.muso_profile_id) {
      const duration = Date.now() - startTime;
      console.log(
        `[MUSO_API] USER_NO_PROFILE: ${userId} | Duration: ${duration}ms`
      );
      // User doesn't have a Muso profile configured
      return null;
    }

    // Fetch the actual Muso data (this will use the KV cache)
    const musoData = await getMusoProfileData(userData.muso_profile_id);

    const totalDuration = Date.now() - startTime;
    console.log(
      `[MUSO_API] USER_DATA_COMPLETE: ${userId} | Profile: ${userData.muso_profile_id} | Total: ${totalDuration}ms`
    );

    return musoData;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(
      `[MUSO_API] USER_DATA_ERROR: ${userId} | Duration: ${duration}ms | Error:`,
      error
    );
    return null;
  }
}

// Optional: Run cleanup periodically (can be called in a cron job or similar)
// Note: With KV store, cleanup is handled automatically by TTL, so this is mainly for logging
let cleanupInterval: NodeJS.Timeout | null = null;

export function startPeriodicCleanup(
  intervalMs: number = 60 * 60 * 1000
): void {
  // Default: 1 hour
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }

  console.log(
    `[MUSO_CLEANUP] STARTING: Interval ${intervalMs / 1000 / 60}min | Instance: ${INSTANCE_ID} | Note: Redis handles TTL automatically`
  );

  cleanupInterval = setInterval(() => {
    console.log(
      `[MUSO_CLEANUP] RUNNING: ${new Date().toISOString()} | Instance: ${INSTANCE_ID} | Note: Redis handles TTL automatically`
    );
    // With Redis store, cleanup is handled automatically by TTL
    musoRedisCache.clear();
  }, intervalMs);
}

export function stopPeriodicCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    console.log(
      `[MUSO_CLEANUP] STOPPED: ${new Date().toISOString()} | Instance: ${INSTANCE_ID}`
    );
  }
}

// Cache statistics for monitoring
export function getCacheStats() {
  console.log(
    `[MUSO_STATS] REQUESTED: ${new Date().toISOString()} | Instance: ${INSTANCE_ID} | Note: Redis stats not available via simple API`
  );
  return {
    note: 'Redis store statistics not available via simple API',
    instanceId: INSTANCE_ID,
    instanceAge: Math.round((Date.now() - INSTANCE_START_TIME) / 1000)
  };
}

// Rate limiting helper function
export async function checkRateLimit(
  userId: string
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  console.log(
    `[MUSO_RATE_LIMIT] CHECK: ${userId} | Timestamp: ${new Date().toISOString()} | Instance: ${INSTANCE_ID}`
  );

  const allowed = await redisRateLimiter.isAllowed(userId);
  const remaining = await redisRateLimiter.getRemainingRequests(userId);
  const resetTime = await redisRateLimiter.getResetTime(userId);

  const result = { allowed, remaining, resetTime };
  console.log(
    `[MUSO_RATE_LIMIT] RESULT: ${userId} | ${JSON.stringify(result)} | Instance: ${INSTANCE_ID}`
  );

  return result;
}

// Export Redis cache instance and rate limiter for potential manual management
export { musoRedisCache, redisRateLimiter };
