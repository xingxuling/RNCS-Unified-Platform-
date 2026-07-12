import { AetherionOperator } from '@/lib/worldEngine';

/**
 * 操作符颜色配置
 */
const OPERATOR_COLORS = {
  CREATE: {
    class: 'border-primary bg-primary/10 text-primary',
    hex: '#06b6d4',
  },
  LOOP: {
    class: 'border-consciousness bg-consciousness/10 text-consciousness',
    hex: '#a855f7',
  },
  BREAK: {
    class: 'border-destructive bg-destructive/10 text-destructive',
    hex: '#ef4444',
  },
  SHIFT: {
    class: 'border-accent bg-accent/10 text-accent',
    hex: '#f59e0b',
  },
  WEAVE: {
    class: 'border-foreground/30 bg-muted text-foreground',
    hex: '#10b981',
  },
} as const;

const DEFAULT_COLORS = {
  class: 'border-border bg-secondary text-foreground',
  hex: '#6b7280',
} as const;

/**
 * 获取操作符对应的颜色
 * @param type 操作符类型
 * @param variant 颜色变体：'class' 返回 Tailwind 类名，'hex' 返回十六进制颜色
 * @returns 颜色字符串
 */
export function getOperatorColor(
  type: string,
  variant: 'class' | 'hex' = 'class'
): string {
  const operator = type as AetherionOperator;
  const colors = OPERATOR_COLORS[operator];
  
  if (colors) {
    return colors[variant];
  }
  
  return DEFAULT_COLORS[variant];
}

/**
 * 获取所有操作符类型
 */
export function getAllOperators(): AetherionOperator[] {
  return Object.keys(OPERATOR_COLORS) as AetherionOperator[];
}

