import { makeCapabilityModel } from "./_makeCapabilityModel";
export const webMusicM = makeCapabilityModel({
  capabilityId: "WEB_MUSIC_M",
  name: "WebMusicM",
  chineseName: "音乐能力模型",
  domain: "MUSIC",
  description: "歌词、曲风、情绪曲线、声线方向、Suno/Udio prompt、角色歌、世界主题曲、OST 概念。",
  inputTypes: ["SONG_IDEA", "CHARACTER_OBJECT", "WORLD_OBJECT", "STORY_OBJECT", "VOCAL_CONCEPT_CHAIN"],
  outputTypes: ["SONG_OBJECT", "LYRIC_OBJECT", "VOCAL_PROMPT_OBJECT", "MUSIC_STYLE_OBJECT", "SUNO_HANDOFF_PACK_OBJECT"],
  requiredKnowledgeSources: ["VOCAL_KNOWLEDGE", "WORLD_KNOWLEDGE", "CHARACTER_KNOWLEDGE"],
  requiredCalculusIds: ["VOCAL_PROMPT_CALCULUS"],
  requiredConstants: ["NO_COPYRIGHT_GUARANTEE", "VOCAL_SAFETY_BOUNDARY"],
  toolInterfaces: ["VOCAL_ENGINE", "WEBLCM", "WEBLLM"],
  workspaceObjectTypes: ["WEB_CAPABILITY_RUN_OBJECT", "SONG_OBJECT"],
  safetyRules: ["CAP_SAFE_008", "CAP_SAFE_009", "CAP_SAFE_010"],
});
