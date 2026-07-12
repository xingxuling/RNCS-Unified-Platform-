import type { ChatResultAction, ChatDisplayResultType } from "./chatDisplayResultTypes";

let idx = 0;
function aid(prefix: string): string { idx += 1; return `${prefix}-${idx}`; }

/**
 * 根据结果类型生成默认的下一步操作。
 * 调用方可以追加自定义动作，或直接覆盖。
 */
export function buildDefaultActions(opts: {
  resultType: ChatDisplayResultType;
  objectId?: string;
  runId?: string;
  detailRoute?: string;
}): ChatResultAction[] {
  const { resultType, detailRoute, objectId, runId } = opts;
  const baseSaveContinue: ChatResultAction[] = [
    { actionId: aid("save"), label: "保存", actionType: "SAVE", targetObjectId: objectId, style: "secondary" },
    { actionId: aid("cont"), label: "继续", actionType: "CONTINUE", style: "secondary" },
  ];
  const openDetail = (label: string): ChatResultAction => ({
    actionId: aid("open"), label, actionType: "OPEN_DETAIL", targetRoute: detailRoute, targetObjectId: objectId, targetRunId: runId, style: "primary",
  });

  switch (resultType) {
    case "TEXT":
      return [
        { actionId: aid("cont"), label: "继续", actionType: "CONTINUE", style: "secondary" },
      ];
    case "APP":
      return [
        ...(detailRoute ? [openDetail("打开应用项目")] : []),
        { actionId: aid("check"), label: "运行代码检查", actionType: "RUN", payload: { taskType: "CHECK_PROJECT" }, style: "secondary" },
        { actionId: aid("fix"),   label: "生成修复建议",  actionType: "RUN", payload: { taskType: "REPAIR_CODE" }, style: "secondary" },
        ...baseSaveContinue,
      ];
    case "CODE":
      return [
        { actionId: aid("fix"),   label: "生成修复建议", actionType: "RUN", payload: { taskType: "REPAIR_CODE" }, style: "primary" },
        { actionId: aid("patch"), label: "生成 Patch 草案", actionType: "RUN", payload: { taskType: "PATCH_DRAFT" }, style: "secondary" },
        { actionId: aid("codex"), label: "生成 Codex 包",  actionType: "RUN", payload: { taskType: "HANDOFF_PACK", target: "CODEX" }, style: "secondary" },
        ...(detailRoute ? [openDetail("打开预览")] : []),
        ...baseSaveContinue,
      ];
    case "PATCH":
      return [
        ...(detailRoute ? [openDetail("查看 Patch")] : []),
        { actionId: aid("codex"),  label: "生成 Codex 包",  actionType: "RUN", payload: { taskType: "HANDOFF_PACK", target: "CODEX" }, style: "secondary" },
        { actionId: aid("cursor"), label: "生成 Cursor 包", actionType: "RUN", payload: { taskType: "HANDOFF_PACK", target: "CURSOR" }, style: "secondary" },
        ...baseSaveContinue,
      ];
    case "WORLD":
      return [
        ...(detailRoute ? [openDetail("打开世界")] : []),
        { actionId: aid("tick"), label: "运行 1 Tick", actionType: "RUN", payload: { worldAction: "TICK" }, style: "secondary" },
        ...baseSaveContinue,
      ];
    case "MUSIC":
      return [
        { actionId: aid("copy"), label: "复制 Suno Prompt", actionType: "COPY", style: "primary" },
        ...(detailRoute ? [openDetail("打开歌词")] : []),
        { actionId: aid("v2"),   label: "生成第二版",        actionType: "CONTINUE", payload: { variant: 2 }, style: "secondary" },
        ...baseSaveContinue,
      ];
    case "CONCEPT":
      return [
        ...(detailRoute ? [openDetail("查看概念链")] : []),
        { actionId: aid("expand"), label: "展开为文本", actionType: "CONTINUE", payload: { expand: true }, style: "secondary" },
        ...baseSaveContinue,
      ];
    case "KNOWLEDGE":
      return [
        ...(detailRoute ? [openDetail("查看知识")] : []),
        { actionId: aid("more"),   label: "继续检索", actionType: "CONTINUE", style: "secondary" },
        ...baseSaveContinue,
      ];
    case "QA":
      return [
        ...(detailRoute ? [openDetail("查看详情")] : []),
        { actionId: aid("fix"),  label: "生成修复建议", actionType: "RUN", payload: { taskType: "REPAIR_CODE" }, style: "secondary" },
        { actionId: aid("save"), label: "保存报告",     actionType: "SAVE", style: "secondary" },
      ];
    case "STORE":
      return [
        ...(detailRoute ? [openDetail("打开商店")] : []),
      ];
    case "OBJECT":
      return [
        ...(detailRoute ? [openDetail("打开对象")] : []),
        ...baseSaveContinue,
      ];
    case "SYSTEM":
      return [
        { actionId: aid("cont"), label: "继续", actionType: "CONTINUE", style: "secondary" },
      ];
    default:
      return baseSaveContinue;
  }
}
