import type { ChatIntentResult } from "./chatIntentResolver";
import type { ChatSuggestedAction } from "./chatMessageEngine";

export function buildSuggestedActions(
  intent: ChatIntentResult,
  ctx: { createdObjectId?: string; pageRoute?: string; needsInstall?: boolean; capabilityStoreRoute?: string },
): ChatSuggestedAction[] {
  const out: ChatSuggestedAction[] = [];

  if (ctx.needsInstall && ctx.capabilityStoreRoute) {
    out.push({ type: "INSTALL_CAPABILITY", label: "去安装该能力", route: ctx.capabilityStoreRoute });
    out.push({ type: "OPEN_PAGE", label: "打开能力商店", route: "/webxxm-store" });
    return out;
  }

  // Ask 类：默认下一步——继续展开 / 生成方案 / 创建对象 / 打开相关页面
  if (intent.inputMode === "ASK_MODE" || intent.inputMode === "ASK_TO_DO_MODE") {
    out.push({ type: "ASK_EXPAND", label: "继续展开" });
    out.push({ type: "ASK_TO_PLAN", label: "生成方案" });
    if (intent.recommendedPath?.[0]?.route) {
      out.push({ type: "OPEN_PAGE", label: intent.recommendedPath[0].label, route: intent.recommendedPath[0].route });
    }
    out.push({ type: "OPEN_PAGE", label: "打开能力商店", route: "/webxxm-store" });
    return out.slice(0, 4);
  }

  switch (intent.intentType) {
    case "CREATE_APP":
    case "DO_CREATE":
      out.push({ type: "OPEN_PAGE", label: "打开应用项目", route: "/app-projects" });
      out.push({ type: "OPEN_PAGE", label: "代码检查", route: "/code-sandbox" });
      out.push({ type: "EXPORT_OBJECT", label: "导出 Handoff", route: "/engine-export" });
      break;
    case "GENERATE_MUSIC":
      out.push({ type: "OPEN_PAGE", label: "打开声乐引擎", route: "/vocal-engine" });
      out.push({ type: "VIEW_QA", label: "查看 QA", route: "/system-audit" });
      break;
    case "GENERATE_STORY":
      out.push({ type: "OPEN_PAGE", label: "打开叙事引擎", route: "/narrative-engine" });
      break;
    case "SIMULATE_WORLD":
    case "DO_RUN":
      out.push({ type: "OPEN_PAGE", label: "运行记录", route: "/runs" });
      break;
    case "QA_CHECK":
    case "DO_CHECK":
      out.push({ type: "OPEN_PAGE", label: "打开 QA 审计", route: "/system-audit" });
      break;
    case "DO_INSTALL":
    case "INSTALL_CAPABILITY":
      out.push({ type: "OPEN_PAGE", label: "能力商店", route: "/webxxm-store" });
      break;
    case "DO_OPEN":
    case "OPEN_PAGE":
      if (intent.pageRoute) out.push({ type: "OPEN_PAGE", label: "打开页面", route: intent.pageRoute });
      break;
    default:
      out.push({ type: "OPEN_PAGE", label: "查看运行历史", route: "/runs" });
      out.push({ type: "OPEN_PAGE", label: "对话历史", route: "/chat-history" });
  }

  if (ctx.createdObjectId) {
    out.unshift({ type: "OPEN_OBJECT", label: "打开新对象", payload: { objectId: ctx.createdObjectId } });
  }
  return out.slice(0, 4);
}
