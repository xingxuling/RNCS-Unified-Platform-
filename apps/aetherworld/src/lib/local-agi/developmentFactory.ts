// 开发工厂 · 扫描系统缺口并生成 Lovable / Codex / 路由 / UI / 接线 / 测试任务
import { saveDevTasks } from "./localAgiStore";
import type { DevelopmentTask, DevTaskKind } from "./localAgiTypes";

function nid(): string {
  return `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export interface DevScanInput {
  totalRoutes?: number;
  brokenRoutes?: number;
  unlinkedChat?: number;
  pendingPFItems?: number;
  uxComplaints?: number;
}

const ACCEPTANCE: Record<DevTaskKind, string[]> = {
  LOVABLE_PROMPT: ["中文化", "给出验收标准", "不破坏已有模块", "tsc --noEmit 通过"],
  CODEX_TASK: ["明确文件路径", "明确改动范围", "提供回滚说明"],
  ROUTE_FIX: ["路由可访问", "页面有 head meta", "在 Page Completeness 中登记"],
  UI_IMPROVE: ["信息层级清晰", "空 / 错误 / 加载状态完整", "中文文案"],
  INTEGRATION: ["Chat 接线可用", "Record 写入正确", "MSL 标识完整"],
  TEST_PLAN: ["列出关键路径", "覆盖失败场景", "包含 tsc 检查"],
};

function buildTask(kind: DevTaskKind, title: string, body: string): DevelopmentTask {
  return {
    id: nid(),
    kind,
    title,
    body,
    acceptance: ACCEPTANCE[kind],
    createdAt: new Date().toISOString(),
  };
}

export function scanAndPlanDevelopment(input: DevScanInput = {}): DevelopmentTask[] {
  const out: DevelopmentTask[] = [];
  const broken = input.brokenRoutes ?? 0;
  const unlinked = input.unlinkedChat ?? 0;
  const pendingPF = input.pendingPFItems ?? 0;
  const ux = input.uxComplaints ?? 0;

  if (broken > 0) {
    out.push(
      buildTask(
        "ROUTE_FIX",
        `修复 ${broken} 个异常路由`,
        "扫描 src/routes，确认 routeTree 是否同步，补齐缺失的 head meta。",
      ),
    );
  }
  if (unlinked > 0) {
    out.push(
      buildTask(
        "INTEGRATION",
        `补齐 ${unlinked} 个未接线 Chat 模块`,
        "为对应模块新增 chatBridge.ts，并在 Chat 主入口分发查询。",
      ),
    );
  }
  if (pendingPF > 0) {
    out.push(
      buildTask(
        "UI_IMPROVE",
        `处理 ${pendingPF} 个 Page Completeness 待办`,
        "按优先级推进未完成 PF 项，补齐空 / 错误 / 加载状态。",
      ),
    );
  }
  if (ux > 0) {
    out.push(
      buildTask(
        "UI_IMPROVE",
        `回应 ${ux} 条体验反馈`,
        "把用户体验反馈聚合后转为可执行的 UI / 文案优化。",
      ),
    );
  }

  // 默认输出：永远准备一个 Lovable 提示词与一个测试计划
  out.push(
    buildTask(
      "LOVABLE_PROMPT",
      "生成下一轮 Aetherworld 提示词草案",
      "根据当前增长方向（数据 / 模型 / 资产 / 用户）生成下一轮 Lovable 提示词，包含验收标准与安全边界。",
    ),
  );
  out.push(
    buildTask(
      "TEST_PLAN",
      "生成下一轮验收测试计划",
      "覆盖：打开主要页面、运行一次总策、切换模式、生成报告、tsc --noEmit。",
    ),
  );

  saveDevTasks(out);
  return out;
}
