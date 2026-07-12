import { makeCapabilityModel } from "./_makeCapabilityModel";
export const webStoryM = makeCapabilityModel({
  capabilityId: "WEB_STORY_M",
  name: "WebStoryM",
  chineseName: "叙事能力模型",
  domain: "STORY",
  description: "剧情、章节、漫画脚本、游戏任务文本、角色弧光、世界事件展开。",
  inputTypes: ["WORLD_OBJECT", "CHARACTER_OBJECT", "QUEST_EVENT_OBJECT", "STORY_IDEA"],
  outputTypes: ["STORY_OBJECT", "CHAPTER_OUTLINE_OBJECT", "SCENE_OBJECT", "COMIC_SCRIPT_OBJECT", "QUEST_TEXT_OBJECT"],
  requiredKnowledgeSources: ["WORLD_KNOWLEDGE", "CHARACTER_KNOWLEDGE", "NARRATIVE_KNOWLEDGE"],
  requiredCalculusIds: ["NARRATIVE_CALCULUS"],
  requiredConstants: ["CANON_GUARD", "VIRTUAL_NOT_REAL"],
  toolInterfaces: ["NARRATIVE_ENGINE", "WEBLWM", "WEBLLM"],
  workspaceObjectTypes: ["WEB_CAPABILITY_RUN_OBJECT", "STORY_OBJECT"],
  safetyRules: ["CAP_SAFE_007", "CAP_SAFE_009", "CAP_SAFE_010"],
});
