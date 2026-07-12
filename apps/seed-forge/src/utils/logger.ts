/**
 * 统一的日志工具
 * 在生产环境自动禁用日志输出
 */

const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) {
      console.log('[LOG]', ...args);
    }
  },
  
  error: (...args: unknown[]) => {
    if (isDev) {
      console.error('[ERROR]', ...args);
    }
    // 生产环境可以发送到错误追踪服务
    // if (!isDev) {
    //   errorTrackingService.log(...args);
    // }
  },
  
  warn: (...args: unknown[]) => {
    if (isDev) {
      console.warn('[WARN]', ...args);
    }
  },
  
  info: (...args: unknown[]) => {
    if (isDev) {
      console.info('[INFO]', ...args);
    }
  },
};

