export interface WebLlmExample {
  id: string;
  title: string;
  taskType: string;
  prompt: string;
  notes: string;
}

export const WEB_LLM_EXAMPLES: WebLlmExample[] = [
  { id: "EX1",  title: "检查 WebGPU 支持",            taskType: "GENERIC",          prompt: "请检测当前浏览器是否支持 WebGPU。", notes: "Availability Detector" },
  { id: "EX2",  title: "加载 small chat model",       taskType: "GENERIC",          prompt: "加载 SMALL_CHAT_MODEL 并报告状态。", notes: "Engine Loader" },
  { id: "EX3",  title: "Sequence AI 使用 WebLLM",     taskType: "SEQUENCE_AI_CHAT", prompt: "用 WebLLM 协助回答：今天我该不该推进项目？", notes: "Sequence AI Bridge" },
  { id: "EX4",  title: "Digital Programmer 生成代码草案", taskType: "CODE_REPAIR",  prompt: "为「番茄钟 App」生成 React 草案。", notes: "Digital Role + App Runtime" },
  { id: "EX5",  title: "Code Sandbox 解释错误",        taskType: "CODE_REPAIR",      prompt: "解释 simulated build 报错 MISSING_ENTRY_FILE。", notes: "Code Sandbox Bridge" },
  { id: "EX6",  title: "Vocal Engine 生成歌词草案",     taskType: "VOCAL_LYRICS",     prompt: "为「夜空与回声」写一段歌词草案。", notes: "Vocal Bridge" },
  { id: "EX7",  title: "Narrative Engine 生成剧情段落", taskType: "NARRATIVE_DRAFT",  prompt: "为蓝天机写一段开场剧情。", notes: "Narrative Bridge" },
  { id: "EX8",  title: "App Runtime 生成 README",       taskType: "DOCS_WRITER",      prompt: "为番茄钟项目生成 README。", notes: "App Runtime Bridge" },
  { id: "EX9",  title: "Neuro Control 检查上下文漂移",   taskType: "GENERIC",          prompt: "检查上一次输出是否偏离任务目标。", notes: "Neuro Control Layer" },
  { id: "EX10", title: "无 WebGPU fallback",            taskType: "GENERIC",          prompt: "当 WebGPU 不可用时，降级到 RULE_ONLY 的示例。", notes: "Fallback Engine" },
];
