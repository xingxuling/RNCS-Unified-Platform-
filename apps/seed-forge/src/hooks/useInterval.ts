import { useEffect, useRef } from 'react';

/**
 * 自定义 Hook：用于创建定时器
 * @param callback 回调函数
 * @param delay 延迟时间（毫秒），null 表示停止定时器
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef<() => void>();

  // 保存最新的回调函数
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // 设置定时器
  useEffect(() => {
    if (delay !== null) {
      const id = setInterval(() => {
        savedCallback.current?.();
      }, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

