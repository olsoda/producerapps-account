'use client';

import { PreviewChangeEvent, PreviewErrorEvent } from '@/types/preview';

// Event types
export type PreviewEventType =
  | 'preview:color:changed'
  | 'preview:content:changed'
  | 'preview:style:changed'
  | 'preview:media:changed'
  | 'preview:links:changed'
  | 'preview:social:changed'
  | 'preview:muso:changed'
  | 'preview:player:changed'
  | 'preview:saved'
  | 'preview:error'
  | 'preview:validation:changed'
  | 'preview:reset'
  | 'preview:batch:update';

export interface PreviewEventData {
  'preview:color:changed': {
    field: 'accent' | 'text' | 'background';
    value: string | null;
    previous?: string | null;
  };
  'preview:content:changed': {
    field: 'headline' | 'intro' | 'custom_path' | 'page_name' | 'branding';
    value: string | boolean | null;
    previous?: string | boolean | null;
  };
  'preview:style:changed': {
    field: 'font' | 'headline_styles' | 'paragraph_styles' | 'link_styles' | 'header_image_styles';
    value: unknown;
    previous?: unknown;
  };
  'preview:media:changed': {
    field: 'header_image' | 'background_image';
    value: string | null;
    previous?: string | null;
  };
  'preview:links:changed': {
    action: 'add' | 'update' | 'remove' | 'reorder';
    links: unknown[];
    linkId?: string;
    changes?: unknown;
  };
  'preview:social:changed': {
    action: 'add' | 'update' | 'remove' | 'reorder';
    socialLinks: unknown[];
    linkId?: string;
    changes?: unknown;
  };
  'preview:muso:changed': {
    field: 'enabled' | 'badges' | 'styling' | 'position' | 'data';
    value: unknown;
    previous?: unknown;
  };
  'preview:player:changed': {
    playerId: number;
    changes: unknown;
  };
  'preview:saved': {
    landingPage: unknown;
    timestamp: number;
  };
  'preview:error': {
    error: Error;
    context: string;
    recoverable: boolean;
  };
  'preview:validation:changed': {
    field: string;
    isValid: boolean;
    errors: string[];
  };
  'preview:reset': {
    reason: 'user_action' | 'error_recovery' | 'data_refresh';
  };
  'preview:batch:update': {
    changes: {
      landingPage?: unknown;
      player?: unknown;
      musoData?: unknown;
    };
  };
}

// Event listener type
export type PreviewEventListener<T extends PreviewEventType> = (
  event: PreviewChangeEvent<PreviewEventData[T]>
) => void;

// Event manager class
class PreviewEventManager {
  private listeners: Map<PreviewEventType, Set<PreviewEventListener<any>>> = new Map();
  private eventHistory: PreviewChangeEvent<any>[] = [];
  private maxHistorySize: number = 100;

  // Subscribe to events
  on<T extends PreviewEventType>(
    eventType: T,
    listener: PreviewEventListener<T>
  ): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    this.listeners.get(eventType)!.add(listener);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(eventType);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          this.listeners.delete(eventType);
        }
      }
    };
  }

  // Emit events
  emit<T extends PreviewEventType>(
    eventType: T,
    data: PreviewEventData[T],
    source: 'user' | 'system' = 'user'
  ): void {
    const event: PreviewChangeEvent<PreviewEventData[T]> = {
      type: eventType,
      payload: data,
      timestamp: Date.now(),
      source
    };

    // Add to history
    this.addToHistory(event);

    // Emit to listeners
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error(`Error in preview event listener for ${eventType}:`, error);
          this.emitError(error as Error, `Event listener for ${eventType}`);
        }
      });
    }

    // Emit to wildcard listeners
    this.emitToWildcardListeners(event);
  }

  // Subscribe to all events
  onAny(listener: PreviewEventListener<any>): () => void {
    return this.on('*' as PreviewEventType, listener);
  }

  // Emit error events
  emitError(error: Error, context: string, recoverable: boolean = true): void {
    const errorEvent: PreviewErrorEvent = {
      type: 'error',
      error,
      context,
      timestamp: Date.now()
    };

    this.emit('preview:error', {
      error,
      context,
      recoverable
    }, 'system');
  }

  // Get event history
  getHistory(eventType?: PreviewEventType): PreviewChangeEvent<any>[] {
    if (eventType) {
      return this.eventHistory.filter(event => event.type === eventType);
    }
    return [...this.eventHistory];
  }

  // Clear history
  clearHistory(): void {
    this.eventHistory = [];
  }

  // Remove all listeners
  removeAllListeners(eventType?: PreviewEventType): void {
    if (eventType) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.clear();
    }
  }

  // Private methods
  private addToHistory(event: PreviewChangeEvent<any>): void {
    this.eventHistory.push(event);
    
    // Keep history size manageable
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }

  private emitToWildcardListeners(event: PreviewChangeEvent<any>): void {
    const wildcardListeners = this.listeners.get('*' as PreviewEventType);
    if (wildcardListeners) {
      wildcardListeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('Error in wildcard event listener:', error);
        }
      });
    }
  }
}

// Global event manager instance
export const previewEvents = new PreviewEventManager();

// React hook for using preview events
import React, { useEffect, useCallback, useRef } from 'react';

export function usePreviewEvent<T extends PreviewEventType>(
  eventType: T,
  listener: PreviewEventListener<T>,
  dependencies: React.DependencyList = []
): void {
  const listenerRef = useRef(listener);
  listenerRef.current = listener;

  useEffect(() => {
    const unsubscribe = previewEvents.on(eventType, (...args) => {
      listenerRef.current(...args);
    });

    return unsubscribe;
  }, [eventType, ...dependencies]);
}

// Hook for emitting events
export function usePreviewEventEmitter() {
  return useCallback(<T extends PreviewEventType>(
    eventType: T,
    data: PreviewEventData[T],
    source: 'user' | 'system' = 'user'
  ) => {
    previewEvents.emit(eventType, data, source);
  }, []);
}

// Hook for event history
export function usePreviewEventHistory(eventType?: PreviewEventType) {
  const [history, setHistory] = React.useState(() => 
    previewEvents.getHistory(eventType)
  );

  useEffect(() => {
    const updateHistory = () => {
      setHistory(previewEvents.getHistory(eventType));
    };

    // Listen to any event to update history
    const unsubscribe = previewEvents.onAny(updateHistory);
    
    return unsubscribe;
  }, [eventType]);

  return history;
}

// Utility functions for common event patterns
export const previewEventUtils = {
  // Emit color change
  emitColorChange: (
    field: 'accent' | 'text' | 'background',
    value: string | null,
    previous?: string | null
  ) => {
    previewEvents.emit('preview:color:changed', { field, value, previous });
  },

  // Emit content change
  emitContentChange: (
    field: 'headline' | 'intro' | 'custom_path' | 'page_name' | 'branding',
    value: string | boolean | null,
    previous?: string | boolean | null
  ) => {
    previewEvents.emit('preview:content:changed', { field, value, previous });
  },

  // Emit style change
  emitStyleChange: (
    field: 'font' | 'headline_styles' | 'paragraph_styles' | 'link_styles' | 'header_image_styles',
    value: unknown,
    previous?: unknown
  ) => {
    previewEvents.emit('preview:style:changed', { field, value, previous });
  },

  // Emit media change
  emitMediaChange: (
    field: 'header_image' | 'background_image',
    value: string | null,
    previous?: string | null
  ) => {
    previewEvents.emit('preview:media:changed', { field, value, previous });
  },

  // Emit links change
  emitLinksChange: (
    action: 'add' | 'update' | 'remove' | 'reorder',
    links: unknown[],
    linkId?: string,
    changes?: unknown
  ) => {
    previewEvents.emit('preview:links:changed', { action, links, linkId, changes });
  },

  // Emit social links change
  emitSocialChange: (
    action: 'add' | 'update' | 'remove' | 'reorder',
    socialLinks: unknown[],
    linkId?: string,
    changes?: unknown
  ) => {
    previewEvents.emit('preview:social:changed', { action, socialLinks, linkId, changes });
  },

  // Emit Muso change
  emitMusoChange: (
    field: 'enabled' | 'badges' | 'styling' | 'position' | 'data',
    value: unknown,
    previous?: unknown
  ) => {
    previewEvents.emit('preview:muso:changed', { field, value, previous });
  },

  // Emit batch update
  emitBatchUpdate: (changes: {
    landingPage?: unknown;
    player?: unknown;
    musoData?: unknown;
  }) => {
    previewEvents.emit('preview:batch:update', { changes });
  },

  // Emit save event
  emitSaved: (landingPage: unknown) => {
    previewEvents.emit('preview:saved', { landingPage, timestamp: Date.now() });
  },

  // Emit validation change
  emitValidationChange: (field: string, isValid: boolean, errors: string[]) => {
    previewEvents.emit('preview:validation:changed', { field, isValid, errors });
  },

  // Emit reset
  emitReset: (reason: 'user_action' | 'error_recovery' | 'data_refresh') => {
    previewEvents.emit('preview:reset', { reason });
  }
};

// Debugging utilities
export const previewEventDebug = {
  // Log all events
  startLogging: () => {
    return previewEvents.onAny((event) => {
      console.log('Preview Event:', event);
    });
  },

  // Get event statistics
  getStats: () => {
    const history = previewEvents.getHistory();
    const eventCounts: Record<string, number> = {};
    
    history.forEach(event => {
      eventCounts[event.type] = (eventCounts[event.type] || 0) + 1;
    });

    return {
      totalEvents: history.length,
      eventCounts,
      recentEvents: history.slice(-10)
    };
  },

  // Performance monitoring
  measureEventPerformance: <T extends PreviewEventType>(
    eventType: T,
    fn: () => void
  ): number => {
    const start = performance.now();
    fn();
    const end = performance.now();
    
    console.log(`Event ${eventType} took ${end - start} milliseconds`);
    return end - start;
  }
};

export default previewEvents; 