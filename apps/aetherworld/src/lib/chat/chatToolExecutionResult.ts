// Chat 工具调用结果类型。
export type ChatToolStatus = "EXECUTED" | "PENDING_CONFIRM" | "BLOCKED" | "SKIPPED";

export interface ChatToolCallRequest {
  toolId: string;
  args: Record<string, unknown>;
  reason?: string;
}

export interface ChatToolCallResult {
  toolId: string;
  status: ChatToolStatus;
  message: string;
  /** 关联的 Workspace / Calendar / Run 对象 id */
  targetId?: string;
  createdAt: string;
}
