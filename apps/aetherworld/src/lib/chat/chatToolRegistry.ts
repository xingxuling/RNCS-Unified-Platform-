// 安全白名单工具实现（v0.1）。
// 所有工具只做"创建草稿 / 打开页面 / 模拟检查"，不执行宿主操作。
import type { ChatToolCallRequest, ChatToolCallResult } from "./chatToolExecutionResult";

type ToolImpl = (req: ChatToolCallRequest) => Promise<ChatToolCallResult> | ChatToolCallResult;

function ok(toolId: string, message: string, targetId?: string): ChatToolCallResult {
  return { toolId, status: "EXECUTED", message, targetId, createdAt: new Date().toISOString() };
}

function newId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

// 轻量本地存储助手（仅供工具持久化草稿；不污染主数据流）
function pushLocal(key: string, item: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    const arr = JSON.parse(localStorage.getItem(key) || "[]");
    arr.unshift(item);
    localStorage.setItem(key, JSON.stringify(arr.slice(0, 100)));
  } catch {
    /* noop */
  }
}

export const TOOL_REGISTRY: Record<string, ToolImpl> = {
  "workspace.saveObject": (req) => {
    const id = newId("ws");
    pushLocal("aether.chat.tool.workspace.v1", { id, ...req.args, createdAt: new Date().toISOString() });
    return ok(req.toolId, "已保存为工作区对象（草稿）。", id);
  },
  "calendar.createTask": (req) => {
    const id = newId("cal");
    pushLocal("aether.chat.tool.calendar.v1", { id, ...req.args, createdAt: new Date().toISOString() });
    return ok(req.toolId, `已创建提醒（${(req.args as any)?.when ?? "时间待定"}）。`, id);
  },
  "codeSandbox.createRun": (req) => {
    const id = newId("csr");
    pushLocal("aether.chat.tool.codeSandbox.v1", {
      id,
      mode: "STATIC_CHECK_ONLY",
      ...req.args,
      createdAt: new Date().toISOString(),
    });
    return ok(req.toolId, "已创建静态检查任务（不会执行真实命令）。", id);
  },
  "appRuntime.createDraft": (req) => {
    const id = newId("app");
    pushLocal("aether.chat.tool.appRuntime.v1", { id, ...req.args, createdAt: new Date().toISOString() });
    return ok(req.toolId, "已创建应用草案，未自动部署。", id);
  },
  "store.openPackage": (req) => {
    const pkg = (req.args as any)?.packageId ?? "(未指定)";
    return ok(req.toolId, `已打开能力包详情：${pkg}。`);
  },
  "social.createDraft": (req) => {
    const id = newId("soc");
    pushLocal("aether.chat.tool.social.v1", {
      id,
      visibility: "PRIVATE",
      ...req.args,
      createdAt: new Date().toISOString(),
    });
    return ok(req.toolId, "已创建社交草稿（PRIVATE，未公开）。", id);
  },
};
