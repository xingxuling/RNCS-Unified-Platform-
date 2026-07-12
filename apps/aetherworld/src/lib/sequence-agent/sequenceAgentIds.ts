// 简易 ID 生成器
export function newAgentRunId(): string {
  return `AGRUN-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
