// Utility functions for cache management

export async function invalidateAnalyticsCache(
  type: 'analytics' | 'player-analytics' | 'dashboard-analytics',
  id?: string | number
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const body: any = { type };
    if (id !== undefined) {
      body.id = id;
    }

    const response = await fetch('/api/invalidate-cache', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to invalidate cache'
      };
    }

    return {
      success: data.success,
      message: data.message
    };
  } catch (error) {
    return {
      success: false,
      error: 'Network error while invalidating cache'
    };
  }
}

// Helper functions for specific cache types
export const invalidateLandingPageCache = (path: string) => 
  invalidateAnalyticsCache('analytics', path);

export const invalidatePlayerCache = (playerId: number) => 
  invalidateAnalyticsCache('player-analytics', playerId);

export const invalidateDashboardCache = () => 
  invalidateAnalyticsCache('dashboard-analytics'); 