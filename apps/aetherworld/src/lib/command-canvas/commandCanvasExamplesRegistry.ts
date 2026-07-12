export interface CommandCanvasExample {
  id: string;
  command: string;
  intentType: string;
  description: string;
}

export const COMMAND_CANVAS_EXAMPLES: CommandCanvasExample[] = [
  { id: "EX1", command: "做一个世界百科 App。", intentType: "CREATE_APP", description: "通过 WebProductM + App Runtime 生成 MVP 计划。" },
  { id: "EX2", command: "修复最新 App 的 React 错误。", intentType: "FIX_CODE", description: "调用 WebCodeM + Code Sandbox 提取 patch。" },
  { id: "EX3", command: "把最新世界生成角色歌。", intentType: "GENERATE_SONG", description: "WebMusicM + Vocal Engine 生成 Suno 提示词。" },
  { id: "EX4", command: "让 WebLWM 跑 1 个 tick。", intentType: "RUN_WORLD_TICK", description: "推进 WebLWM 世界时间线 1 步。" },
  { id: "EX5", command: "检查最新输出有没有违反常数。", intentType: "CHECK_QA", description: "调用 WebCoM + System Constitution 审计。" },
  { id: "EX6", command: "打开最新 App Project。", intentType: "OPEN_OBJECT", description: "在 Canvas 中打开最近的 APP_PROJECT_OBJECT。" },
];
