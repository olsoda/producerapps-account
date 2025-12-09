'use client';

import { LandingPage, Player, Song, MusoData, ValidationResult } from '@/types/preview';
import { previewEvents } from './preview-events';

// Error types specific to preview functionality
export class PreviewError extends Error {
  constructor(
    message: string,
    public code: string,
    public context: string,
    public recoverable: boolean = true,
    public data?: any
  ) {
    super(message);
    this.name = 'PreviewError';
  }
}

export class ValidationError extends PreviewError {
  constructor(
    message: string,
    public field: string,
    public value: any
  ) {
    super(message, 'VALIDATION_ERROR', `Field: ${field}`, true, { field, value });
  }
}

export class DataIntegrityError extends PreviewError {
  constructor(
    message: string,
    public dataType: string,
    public expectedFormat: string
  ) {
    super(message, 'DATA_INTEGRITY_ERROR', `DataType: ${dataType}`, false, { 
      dataType, 
      expectedFormat 
    });
  }
}

export class SaveError extends PreviewError {
  constructor(
    message: string,
    public retryable: boolean = true
  ) {
    super(message, 'SAVE_ERROR', 'Save operation', retryable);
  }
}

export class NetworkError extends PreviewError {
  constructor(
    message: string,
    public statusCode?: number,
    public endpoint?: string
  ) {
    super(message, 'NETWORK_ERROR', `Endpoint: ${endpoint}`, true, { 
      statusCode, 
      endpoint 
    });
  }
}

// Error recovery strategies
export interface ErrorRecoveryStrategy {
  canRecover(error: PreviewError): boolean;
  recover(error: PreviewError, context: any): Promise<any> | any;
  getRecoveryMessage(error: PreviewError): string;
}

class ValidationErrorRecovery implements ErrorRecoveryStrategy {
  canRecover(error: PreviewError): boolean {
    return error instanceof ValidationError;
  }

  recover(error: ValidationError, context: any) {
    // Reset field to last valid value or default
    const defaultValues: Record<string, any> = {
      custom_path: 'untitled-page',
      page_headline: '',
      intro_copy: '',
      page_name: 'Untitled Page'
    };

    return defaultValues[error.field] ?? '';
  }

  getRecoveryMessage(error: ValidationError): string {
    return `Validation error for ${error.field}: ${error.message}. Reverting to default value.`;
  }
}

class DataIntegrityErrorRecovery implements ErrorRecoveryStrategy {
  canRecover(error: PreviewError): boolean {
    return error instanceof DataIntegrityError && error.recoverable;
  }

  recover(error: DataIntegrityError, context: any) {
    // Return safe defaults based on data type
    const defaults: Record<string, any> = {
      'landing-page': this.getDefaultLandingPage(),
      'player': this.getDefaultPlayer(),
      'songs': [],
      'muso-data': null,
      'json': {},
      'array': [],
      'styles': {}
    };

    return defaults[error.dataType] ?? null;
  }

  getRecoveryMessage(error: DataIntegrityError): string {
    return `Data integrity issue with ${error.dataType}. Using safe defaults.`;
  }

  private getDefaultLandingPage(): Partial<LandingPage> {
    return {
      custom_path: 'untitled-page',
      page_headline: 'Welcome',
      intro_copy: '',
      page_name: 'Untitled Page',
      accent_color_override: null,
      text_color: null,
      page_background_color: null,
      font_override: null,
      show_branding: true,
      user_branding_name: '',
      header_image_url: null,
      background_image: null,
      links: [],
      social_links: [],
      muso_stats_config: null
    };
  }

  private getDefaultPlayer(): Partial<Player> {
    return {
      accent_color: '#2462EB',
      background_color: '#ffffff',
      foreground_neutral: '#f1f5f9',
      text_color: '#111111',
      before_audio_label: 'Before',
      after_audio_label: 'After',
      show_branding: true,
      show_artwork: true,
      auto_advance: false,
      player_name: 'My Player',
      theme: 'default'
    };
  }
}

class SaveErrorRecovery implements ErrorRecoveryStrategy {
  canRecover(error: PreviewError): boolean {
    return error instanceof SaveError && error.retryable;
  }

  async recover(error: SaveError, context: any) {
    // Implement retry logic with exponential backoff
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        return await context.retryAction();
      } catch (retryError) {
        retryCount++;
        if (retryCount >= maxRetries) {
          throw new SaveError('Save failed after maximum retries', false);
        }
      }
    }
  }

  getRecoveryMessage(error: SaveError): string {
    return `Save operation failed: ${error.message}. Retrying...`;
  }
}

class NetworkErrorRecovery implements ErrorRecoveryStrategy {
  canRecover(error: PreviewError): boolean {
    return error instanceof NetworkError && this.isRetryableStatus(error.statusCode);
  }

  async recover(error: NetworkError, context: any) {
    // Retry with exponential backoff for network errors
    const delay = 2000; // 2 seconds
    await new Promise(resolve => setTimeout(resolve, delay));
    
    if (context.retryRequest) {
      return await context.retryRequest();
    }
    
    throw new NetworkError('Network retry failed', error.statusCode, error.endpoint);
  }

  getRecoveryMessage(error: NetworkError): string {
    return `Network error (${error.statusCode}): ${error.message}. Retrying request...`;
  }

  private isRetryableStatus(statusCode?: number): boolean {
    if (!statusCode) return true;
    return statusCode >= 500 || statusCode === 408 || statusCode === 429;
  }
}

// Error handler manager
class PreviewErrorHandler {
  private strategies: ErrorRecoveryStrategy[] = [
    new ValidationErrorRecovery(),
    new DataIntegrityErrorRecovery(),
    new SaveErrorRecovery(),
    new NetworkErrorRecovery()
  ];

  private errorHistory: PreviewError[] = [];
  private maxHistorySize = 50;

  async handleError(error: Error | PreviewError, context?: any): Promise<any> {
    const previewError = this.normalizeError(error);
    
    // Add to history
    this.addToHistory(previewError);
    
    // Emit error event
    previewEvents.emitError(previewError, previewError.context, previewError.recoverable);
    
    // Try to recover
    if (previewError.recoverable) {
      const strategy = this.findRecoveryStrategy(previewError);
      if (strategy) {
        try {
          const recovery = await strategy.recover(previewError, context);
          const message = strategy.getRecoveryMessage(previewError);
          
          console.warn(message);
          
          // Emit recovery event
          previewEvents.emit('preview:error', {
            error: previewError,
            context: previewError.context,
            recoverable: true
          }, 'system');
          
          return recovery;
        } catch (recoveryError) {
          console.error('Error recovery failed:', recoveryError);
          throw previewError;
        }
      }
    }
    
    // If not recoverable or recovery failed
    throw previewError;
  }

  private normalizeError(error: Error | PreviewError): PreviewError {
    if (error instanceof PreviewError) {
      return error;
    }
    
    // Convert common errors to PreviewError
    if (error.message.includes('fetch')) {
      return new NetworkError(error.message);
    }
    
    if (error.message.includes('JSON')) {
      return new DataIntegrityError(error.message, 'json', 'Valid JSON object');
    }
    
    return new PreviewError(
      error.message,
      'UNKNOWN_ERROR',
      'General operation',
      true
    );
  }

  private findRecoveryStrategy(error: PreviewError): ErrorRecoveryStrategy | null {
    return this.strategies.find(strategy => strategy.canRecover(error)) || null;
  }

  private addToHistory(error: PreviewError): void {
    this.errorHistory.push(error);
    
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(-this.maxHistorySize);
    }
  }

  getErrorHistory(): PreviewError[] {
    return [...this.errorHistory];
  }

  getErrorStats() {
    const errorCounts: Record<string, number> = {};
    
    this.errorHistory.forEach(error => {
      errorCounts[error.code] = (errorCounts[error.code] || 0) + 1;
    });

    return {
      totalErrors: this.errorHistory.length,
      errorCounts,
      recentErrors: this.errorHistory.slice(-5)
    };
  }

  clearHistory(): void {
    this.errorHistory = [];
  }
}

// Global error handler instance
export const previewErrorHandler = new PreviewErrorHandler();

// React hooks for error handling
import React, { useState, useEffect, useCallback } from 'react';

export function usePreviewErrorHandler() {
  const [errors, setErrors] = useState<PreviewError[]>([]);
  const [isRecovering, setIsRecovering] = useState(false);

  useEffect(() => {
    const unsubscribe = previewEvents.on('preview:error', (event) => {
      const error = event.payload.error instanceof PreviewError 
        ? event.payload.error 
        : new PreviewError(event.payload.error.message, 'UNKNOWN_ERROR', event.payload.context);
      setErrors(prev => [...prev, error]);
    });

    return unsubscribe;
  }, []);

  const handleError = useCallback(async (error: Error | PreviewError, context?: any) => {
    setIsRecovering(true);
    try {
      const result = await previewErrorHandler.handleError(error, context);
      return result;
    } finally {
      setIsRecovering(false);
    }
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const dismissError = useCallback((errorIndex: number) => {
    setErrors(prev => prev.filter((_, index) => index !== errorIndex));
  }, []);

  return {
    errors,
    isRecovering,
    handleError,
    clearErrors,
    dismissError,
    hasErrors: errors.length > 0
  };
}

// Validation utilities
export const previewValidation = {
  validateCustomPath: (path: string): ValidationResult => {
    const errors: string[] = [];
    
    if (!path || path.trim() === '') {
      errors.push('Custom path is required');
    } else if (!/^[a-zA-Z0-9-_]+$/.test(path)) {
      errors.push('Custom path can only contain letters, numbers, hyphens, and underscores');
    } else if (path.length < 3) {
      errors.push('Custom path must be at least 3 characters long');
    } else if (path.length > 50) {
      errors.push('Custom path must be less than 50 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  validateUrl: (url: string, required: boolean = false): ValidationResult => {
    const errors: string[] = [];
    
    if (!url || url.trim() === '') {
      if (required) {
        errors.push('URL is required');
      }
    } else {
      try {
        new URL(url);
      } catch {
        errors.push('Please enter a valid URL');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  validateColor: (color: string | null): ValidationResult => {
    const errors: string[] = [];
    
    if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      errors.push('Color must be a valid hex color (e.g., #FF0000)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  validateImageFile: (file: File): ValidationResult => {
    const errors: string[] = [];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    if (file.size > maxSize) {
      errors.push('Image file must be less than 5MB');
    }

    if (!allowedTypes.includes(file.type)) {
      errors.push('Image must be JPEG, PNG, GIF, or WebP format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  validateLandingPage: (landingPage: Partial<LandingPage>): ValidationResult => {
    const errors: string[] = [];
    
    // Validate required fields
    const pathValidation = previewValidation.validateCustomPath(landingPage.custom_path || '');
    if (!pathValidation.isValid) {
      errors.push(...pathValidation.errors);
    }

    // Validate colors if provided
    if (landingPage.accent_color_override) {
      const colorValidation = previewValidation.validateColor(landingPage.accent_color_override);
      if (!colorValidation.isValid) {
        errors.push(...colorValidation.errors.map(err => `Accent color: ${err}`));
      }
    }

    if (landingPage.text_color) {
      const colorValidation = previewValidation.validateColor(landingPage.text_color);
      if (!colorValidation.isValid) {
        errors.push(...colorValidation.errors.map(err => `Text color: ${err}`));
      }
    }

    if (landingPage.page_background_color) {
      const colorValidation = previewValidation.validateColor(landingPage.page_background_color);
      if (!colorValidation.isValid) {
        errors.push(...colorValidation.errors.map(err => `Background color: ${err}`));
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

// Safe data operations
export const safeDataOps = {
  parseJson: <T>(jsonString: string | null, fallback: T): T => {
    if (!jsonString) return fallback;
    
    try {
      return JSON.parse(jsonString) as T;
    } catch (error) {
      console.warn('Failed to parse JSON, using fallback:', error);
      return fallback;
    }
  },

  safeColorAccess: (color: string | null, fallback: string): string => {
    if (!color) return fallback;
    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
      console.warn(`Invalid color format: ${color}, using fallback`);
      return fallback;
    }
    return color;
  },

  safeArrayAccess: <T>(array: T[] | null | undefined, fallback: T[] = []): T[] => {
    if (!Array.isArray(array)) return fallback;
    return array;
  },

  safeNumberAccess: (value: number | null | undefined, fallback: number, min?: number, max?: number): number => {
    if (typeof value !== 'number' || isNaN(value)) return fallback;
    
    if (min !== undefined && value < min) return min;
    if (max !== undefined && value > max) return max;
    
    return value;
  },

  safeStringAccess: (value: string | null | undefined, fallback: string, maxLength?: number): string => {
    if (typeof value !== 'string') return fallback;
    
    if (maxLength && value.length > maxLength) {
      return value.substring(0, maxLength);
    }
    
    return value;
  }
};

// Fallback component for error boundaries
export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  context?: string;
}

export function PreviewErrorFallback({ error, resetError, context }: ErrorFallbackProps) {
  return React.createElement('div', {
    className: "flex flex-col items-center justify-center p-8 border border-red-200 rounded-lg bg-red-50"
  }, [
    React.createElement('div', {
      key: 'title',
      className: "text-red-600 text-lg font-semibold mb-2"
    }, 'Preview Error'),
    React.createElement('div', {
      key: 'content',
      className: "text-red-500 text-sm mb-4 text-center"
    }, [
      context && React.createElement('div', {
        key: 'context',
        className: "font-medium"
      }, `Context: ${context}`),
      React.createElement('div', {
        key: 'message'
      }, error.message)
    ]),
    React.createElement('button', {
      key: 'button',
      onClick: resetError,
      className: "px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
    }, 'Try Again')
  ]);
}

export default previewErrorHandler; 