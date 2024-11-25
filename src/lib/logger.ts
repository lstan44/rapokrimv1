import * as Sentry from "@sentry/react";

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogOptions {
  tags?: Record<string, string>;
  extra?: Record<string, any>;
}

class Logger {
  private isDevelopment = import.meta.env.MODE === 'development';
  private performanceMarks: Record<string, number> = {};

  private log(level: LogLevel, message: string | Error, category?: string, options: LogOptions = {}) {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      category,
      ...options
    };

    // Development console logging
    if (this.isDevelopment) {
      const consoleMethod = {
        debug: console.debug,
        info: console.log,
        warn: console.warn,
        error: console.error
      }[level];

      consoleMethod(
        `[${timestamp}] [${level.toUpperCase()}]${category ? ` [${category}]` : ''}`,
        message,
        options.extra ? '\nExtra:' : '',
        options.extra || '',
        options.tags ? '\nTags:' : '',
        options.tags || ''
      );
    }

    // Production logging to Sentry
    if (level === 'error') {
      Sentry.captureException(message instanceof Error ? message : new Error(String(message)), {
        tags: { category, ...options.tags },
        extra: options.extra
      });
    } else {
      Sentry.addBreadcrumb({
        category,
        message: message instanceof Error ? message.message : String(message),
        level: level === 'warn' ? 'warning' : level,
        data: options.extra
      });
    }
  }

  debug(message: string, category?: string, options?: LogOptions) {
    if (this.isDevelopment) {
      this.log('debug', message, category, options);
    }
  }

  info(message: string, category?: string, options?: LogOptions) {
    this.log('info', message, category, options);
  }

  warn(message: string, category?: string, options?: LogOptions) {
    this.log('warn', message, category, options);
  }

  error(error: Error | string, category?: string, options?: LogOptions) {
    this.log('error', error, category, options);
  }

  performance = {
    start: (label: string) => {
      this.performanceMarks[label] = performance.now();
    },
    
    end: (label: string) => {
      const startTime = this.performanceMarks[label];
      if (startTime) {
        const duration = performance.now() - startTime;
        delete this.performanceMarks[label];
        
        if (this.isDevelopment) {
          console.log(`[PERFORMANCE] ${label}: ${duration.toFixed(2)}ms`);
        }
        
        Sentry.addBreadcrumb({
          category: 'performance',
          message: `${label} completed`,
          data: { duration },
          level: 'info'
        });
      }
    }
  };
}

export const logger = new Logger();