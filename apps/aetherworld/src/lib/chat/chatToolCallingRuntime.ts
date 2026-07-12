// Chat 工具调用运行时：解析模型输出中的 ```aether-tool 代码块 → 校验 → 执行。
import type { ChatToolCallRequest, ChatToolCallResult } from "./chatToolExecutionResult";
import { checkToolPermission } from "./chatToolPermissionGuard";
import { TOOL_REGISTRY } from "./chatToolRegistry";

const FENCE = /```aether-tool\s*([\s\S]*?)```/g;

export function parseToolCalls(text: string): ChatToolCallRequest[] {
  const out: ChatToolCallRequest[] = [];
  if (!text) return out;
  let m: RegExpExecArray | null;
  while ((m = FENCE.exec(text)) !== null) {
    const block = m[1].trim();
    try {
      const parsed = JSON.parse(block);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of arr) {
        if (item && typeof item.tool === "string") {
          out.push({
            toolId: item.tool,
            args: (item.args && typeof item.args === "object") ? item.args : {},
            reason: typeof item.reason === "string" ? item.reason : undefined,
          });
        }
      }
    } catch {
      /* 忽略格式错误的工具调用块 */
    }
  }
  return out;
}

export async function executeToolCalls(reqs: ChatToolCallRequest[]): Promise<ChatToolCallResult[]> {
  const results: ChatToolCallResult[] = [];
  for (const req of reqs) {
    const decision = checkToolPermission(req);
    if (!decision.allowed) {
      results.push({
        toolId: req.toolId,
        status: decision.needsConfirm ? "PENDING_CONFIRM" : "BLOCKED",
        message: decision.reason,
        createdAt: new Date().toISOString(),
      });
      continue;
    }
    const impl = TOOL_REGISTRY[req.toolId];
    if (!impl) {
      results.push({
        toolId: req.toolId,
        status: "BLOCKED",
        message: "工具未注册。",
        createdAt: new Date().toISOString(),
      });
      continue;
    }
    try {
      const res = await impl(req);
      results.push(res);
    } catch (e: any) {
      results.push({
        toolId: req.toolId,
        status: "BLOCKED",
        message: `执行异常：${e?.message ?? String(e)}`,
        createdAt: new Date().toISOString(),
      });
    }
  }
  return results;
}

/** 去除模型回答中的 aether-tool 代码块，避免在 UI 中重复显示。 */
export function stripToolBlocks(text: string): string {
  return text.replace(FENCE, "").trim();
}
