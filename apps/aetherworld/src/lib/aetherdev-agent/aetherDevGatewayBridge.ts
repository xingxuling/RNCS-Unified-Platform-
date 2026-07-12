// AetherDev · 本地网关桥（只读检查命令）
// MVP：未检测到本地网关时全部返回 NEEDS_LOCAL_GATEWAY；连接后才允许白名单只读命令。
import { evaluateCommandSafety } from "./aetherDevSafetyPolicy";
import { newDevId } from "./aetherDevStore";
import type { DevAutomationLevel, DevCommandCheck } from "./aetherDevTypes";

const DEFAULT_GATEWAY = "http://localhost:18777";

interface RunCommandInput {
  runId: string;
  command: string;
  level: DevAutomationLevel;
  baseUrl?: string;
}

export async function devRunCommand(input: RunCommandInput): Promise<DevCommandCheck> {
  const now = new Date().toISOString();
  const safety = evaluateCommandSafety(input.command, input.level);
  if (!safety.allowed) {
    return {
      id: newDevId("DEV-CHK"),
      runId: input.runId,
      command: input.command,
      status: safety.fallbackStatus,
      outputSummary: safety.reason,
      rawOutputPreview: "",
      createdAt: now,
    };
  }

  if (typeof fetch === "undefined" || typeof window === "undefined") {
    return {
      id: newDevId("DEV-CHK"),
      runId: input.runId,
      command: input.command,
      status: "NEEDS_LOCAL_GATEWAY",
      outputSummary: "SSR 或无 fetch 环境，无法调用本地网关",
      rawOutputPreview: "",
      createdAt: now,
    };
  }

  const base = (input.baseUrl ?? DEFAULT_GATEWAY).replace(/\/$/, "");
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2000);
    const res = await fetch(`${base}/dev/run-command`, {
      method: "POST",
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command: input.command, readOnly: true }),
    });
    clearTimeout(t);
    if (!res.ok) {
      return {
        id: newDevId("DEV-CHK"),
        runId: input.runId,
        command: input.command,
        status: "FAIL",
        outputSummary: `本地网关返回 ${res.status}`,
        rawOutputPreview: "",
        createdAt: now,
      };
    }
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      summary?: string;
      preview?: string;
    };
    return {
      id: newDevId("DEV-CHK"),
      runId: input.runId,
      command: input.command,
      status: data.ok === false ? "FAIL" : "PASS",
      outputSummary: data.summary ?? "完成",
      rawOutputPreview: (data.preview ?? "").slice(0, 800),
      createdAt: now,
    };
  } catch {
    return {
      id: newDevId("DEV-CHK"),
      runId: input.runId,
      command: input.command,
      status: "NEEDS_LOCAL_GATEWAY",
      outputSummary: "未检测到本地网关 / 请在本机启动 local-gateway",
      rawOutputPreview: "",
      createdAt: now,
    };
  }
}
