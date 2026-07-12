import type { CommandIntentType } from "@/constants/command-canvas/commandIntentTypes";
import type { CanvasObjectType } from "@/constants/command-canvas/canvasObjectTypes";

export interface CommandIntent {
  intentType: CommandIntentType;
  targetObjectType?: CanvasObjectType;
  selectedCapabilityIds: string[];
  targetRuntime: string;
  qaRequired: boolean;
  workspaceSaveRequired: boolean;
}

const RULES: { intent: CommandIntentType; keywords: string[]; objectType?: CanvasObjectType; capability?: string; runtime: string }[] = [
  { intent: "CREATE_APP", keywords: ["做一个", "做个", "create app", "新建 app", "应用", "app"], objectType: "APP_PROJECT_OBJECT", capability: "WEB_PRODUCT_M", runtime: "APP_RUNTIME" },
  { intent: "FIX_CODE", keywords: ["修复", "fix", "bug", "报错", "error", "patch"], objectType: "CODE_RUN_RESULT_OBJECT", capability: "WEB_CODE_M", runtime: "CODE_SANDBOX" },
  { intent: "GENERATE_SONG", keywords: ["歌", "歌词", "song", "suno", "vocal", "音乐"], objectType: "SONG_OBJECT", capability: "WEB_MUSIC_M", runtime: "VOCAL_ENGINE" },
  { intent: "GENERATE_STORY", keywords: ["剧情", "故事", "story", "章节", "scene", "漫画"], objectType: "STORY_OBJECT", capability: "WEB_STORY_M", runtime: "NARRATIVE_ENGINE" },
  { intent: "RUN_WORLD_TICK", keywords: ["tick", "推进世界", "weblwm", "world tick"], objectType: "WEBLWM_WORLD_OBJECT", runtime: "WEBLWM" },
  { intent: "RUN_KNOWLEDGE_TRINITY", keywords: ["weblkm", "webcm", "webcom", "知识三体", "trinity"], objectType: "WEB_KNOWLEDGE_TRINITY_RUN_OBJECT", runtime: "WEB_KNOWLEDGE_TRINITY" },
  { intent: "CHECK_QA", keywords: ["qa", "审计", "违反", "check", "审查"], runtime: "QA" },
  { intent: "EXPORT", keywords: ["导出", "export", "handoff"], runtime: "EXPORT" },
  { intent: "OPEN_OBJECT", keywords: ["打开", "open"], runtime: "WORKSPACE" },
  { intent: "RUN_CAPABILITY", keywords: ["运行能力", "webxxm", "capability"], objectType: "WEB_CAPABILITY_RUN_OBJECT", capability: "WEB_PRODUCT_M", runtime: "WEB_CAPABILITY" },
];

export function resolveCommandIntent(raw: string): CommandIntent {
  const lower = raw.toLowerCase();
  for (const r of RULES) {
    if (r.keywords.some((k) => lower.includes(k.toLowerCase()))) {
      return {
        intentType: r.intent,
        targetObjectType: r.objectType,
        selectedCapabilityIds: r.capability ? [r.capability] : [],
        targetRuntime: r.runtime,
        qaRequired: true,
        workspaceSaveRequired: true,
      };
    }
  }
  return {
    intentType: "UNKNOWN",
    selectedCapabilityIds: [],
    targetRuntime: "SEQUENCE_AI",
    qaRequired: true,
    workspaceSaveRequired: false,
  };
}
