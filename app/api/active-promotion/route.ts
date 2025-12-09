import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Initialize Redis client using environment variables
// Will be null if env vars are not set
let redis: Redis | null = null;
try {
  redis = Redis.fromEnv();
} catch (error) {
  console.warn('[ACTIVE_PROMOTION] Redis not available:', error);
}

const CACHE_KEY = 'active-promotion';
const CACHE_TTL_NO_PROMOTION = 24 * 60 * 60; // 24 hours when no promotion (common case)
const CACHE_TTL_WITH_PROMOTION = 5 * 60; // 5 minutes when promotion exists (time-sensitive)

interface Promotion {
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  discount: number;
  discountType: 'percentage' | 'fixed';
  appliesToMonthly: boolean;
  appliesToYearly: boolean;
  active: boolean;
}

interface PromotionResponse {
  promotion: Promotion | null;
}

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Try to get from cache first
    if (redis) {
      try {
        const cached = await redis.get(CACHE_KEY);
        if (cached) {
          const parsedData =
            typeof cached === 'string' ? JSON.parse(cached) : cached;
          console.log('[ACTIVE_PROMOTION] Cache HIT');
          return NextResponse.json(parsedData);
        }
      } catch (error) {
        console.warn('[ACTIVE_PROMOTION] Cache read error:', error);
        // Continue to fetch if cache read fails
      }
    }

    // Fetch from external API with timeout
    console.log('[ACTIVE_PROMOTION] Cache MISS, fetching from external API');

    let response: Response;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      response = await fetch('https://mixflip.io/api/active-promotion', {
        cache: 'no-store',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('[ACTIVE_PROMOTION] Fetch timeout');
      } else {
        console.error('[ACTIVE_PROMOTION] Fetch error:', error.message);
      }
      return NextResponse.json({ promotion: null });
    }

    if (!response.ok) {
      console.error(
        '[ACTIVE_PROMOTION] External API error:',
        response.status,
        response.statusText
      );
      // Return null promotion if external API fails
      return NextResponse.json({ promotion: null });
    }

    // Parse and validate response
    let data: PromotionResponse;
    try {
      const text = await response.text();

      // Handle empty response
      if (!text || text.trim() === '') {
        console.warn('[ACTIVE_PROMOTION] Empty response from external API');
        return NextResponse.json({ promotion: null });
      }

      const jsonData = JSON.parse(text);

      // Validate response structure
      if (!jsonData || typeof jsonData !== 'object') {
        console.warn('[ACTIVE_PROMOTION] Invalid response structure');
        return NextResponse.json({ promotion: null });
      }

      // Ensure we have the expected structure
      // Handle both { promotion: {...} } and direct promotion object
      data = {
        promotion:
          jsonData.promotion !== undefined
            ? jsonData.promotion
            : jsonData.active !== undefined
              ? jsonData
              : null
      };

      // Validate promotion object if it exists
      // Check that it has required fields and active flag
      if (
        data.promotion &&
        (typeof data.promotion !== 'object' ||
          typeof data.promotion.active !== 'boolean' ||
          !data.promotion.name ||
          !data.promotion.code)
      ) {
        console.warn(
          '[ACTIVE_PROMOTION] Invalid promotion object - missing required fields'
        );
        data.promotion = null;
      }
    } catch (error) {
      console.error('[ACTIVE_PROMOTION] JSON parse error:', error);
      return NextResponse.json({ promotion: null });
    }

    // Only cache valid responses (even if promotion is null, that's valid)
    // This prevents caching error states
    // Use longer TTL when no promotion (common case) to reduce API calls
    if (redis && data !== undefined) {
      try {
        const ttl = data.promotion?.active
          ? CACHE_TTL_WITH_PROMOTION
          : CACHE_TTL_NO_PROMOTION;

        await redis.setex(CACHE_KEY, ttl, JSON.stringify(data));
        console.log(
          `[ACTIVE_PROMOTION] Cached ${data.promotion?.active ? 'active promotion' : 'no promotion'} for ${ttl / 60} minutes`
        );
      } catch (error) {
        console.warn('[ACTIVE_PROMOTION] Cache write error:', error);
        // Continue even if cache write fails
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[ACTIVE_PROMOTION] Error:', error);
    // Return null promotion on error
    return NextResponse.json({ promotion: null });
  }
}
