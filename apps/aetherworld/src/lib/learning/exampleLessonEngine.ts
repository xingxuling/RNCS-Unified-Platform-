import type { UserLearningLevel } from "@/constants/learning/userLearningLevels";

export interface ExampleLesson {
  lessonId: string;
  title: string;
  targetUserLevel: UserLearningLevel;
  scenario: string;
  inputText: string;
  engineRoute: string[];
  expectedOutputSummary: string;
  nextActions: string[];
  validationPoints: string[];
}

export const EXAMPLE_LESSONS: ExampleLesson[] = [
  { lessonId: "el_should_i_proceed", title: "我该不该推进这个项目？", targetUserLevel: "BEGINNER", scenario: "需要快速结构化判断。", inputText: "我现在该不该推进这个项目？", engineRoute: ["/free-answer", "/sequence-ai"], expectedOutputSummary: "结论 + 下一步 + 验证点。", nextActions: ["保存结论", "重新计算"], validationPoints: ["主体模式是否正确", "是否需要专业意见"] },
  { lessonId: "el_full60_ask_ai", title: "用 Full60 问数列 AI", targetUserLevel: "ADVANCED", scenario: "真实主体深度评估。", inputText: "请评估方案 A 与方案 B 的潜在风险与机会。", engineRoute: ["/subject-mode", "/sequence-ai"], expectedOutputSummary: "高密度结构化评估。", nextActions: ["导出报告"], validationPoints: ["Full60 是否仅本地"] },
  { lessonId: "el_world_55555", title: "用 55555 生成世界", targetUserLevel: "CREATOR", scenario: "创作虚拟世界。", inputText: "55555", engineRoute: ["/world-engine", "/world-simulation"], expectedOutputSummary: "世界 snapshot + 模拟事件。", nextActions: ["导出 Godot JSON"], validationPoints: ["虚拟 ≠ 现实"] },
  { lessonId: "el_block_49_60", title: "运行 BLOCK 49..60", targetUserLevel: "ADVANCED", scenario: "终端段编译。", inputText: "block 49..60", engineRoute: ["/sequence-terminal"], expectedOutputSummary: "段落结构化输出。", nextActions: [], validationPoints: [] },
  { lessonId: "el_lantian_comic", title: "生成蓝天机漫画脚本", targetUserLevel: "CREATOR", scenario: "剧情 + 分镜。", inputText: "蓝天机第一话分镜", engineRoute: ["/narrative-engine"], expectedOutputSummary: "分镜脚本。", nextActions: [], validationPoints: [] },
  { lessonId: "el_lyrics_suno", title: "把歌词生成 Suno Prompt", targetUserLevel: "CREATOR", scenario: "音乐生成。", inputText: "歌词文本", engineRoute: ["/vocal-engine"], expectedOutputSummary: "Suno prompt。", nextActions: [], validationPoints: [] },
  { lessonId: "el_godot_npc", title: "生成 Godot NPC JSON", targetUserLevel: "BUILDER", scenario: "引擎对接。", inputText: "NPC: 守林人", engineRoute: ["/world-presentation"], expectedOutputSummary: "Godot 兼容 JSON。", nextActions: [], validationPoints: [] },
  { lessonId: "el_constant_audit", title: "运行常数审计", targetUserLevel: "FOUNDER", scenario: "治理。", inputText: "constants.audit", engineRoute: ["/constant-audit"], expectedOutputSummary: "常数审计报告。", nextActions: [], validationPoints: [] },
  { lessonId: "el_constitution_check", title: "运行宪法合规", targetUserLevel: "FOUNDER", scenario: "治理。", inputText: "constitution.check", engineRoute: ["/system-constitution"], expectedOutputSummary: "合规报告。", nextActions: [], validationPoints: [] },
  { lessonId: "el_fix_quickstart_stale", title: "修复 UI 快速开始过期", targetUserLevel: "ADVANCED", scenario: "UI 治理。", inputText: "ui.audit", engineRoute: ["/ui-update-engine", "/quick-start-manager"], expectedOutputSummary: "Quick Start 重新生成。", nextActions: [], validationPoints: [] },
];

export function listExampleLessons() {
  return [...EXAMPLE_LESSONS];
}
