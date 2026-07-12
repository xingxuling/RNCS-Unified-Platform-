// Bridges Aetherworld object types to social object types.
import type { SocialObjectType } from "@/constants/social/socialObjectTypes";

export interface AetherObjectRef {
  objectId: string;
  objectType: string;
  title?: string;
  summary?: string;
}

export function mapObjectTypeToSocialType(objectType: string): SocialObjectType {
  const t = objectType.toUpperCase();
  if (t.includes("APP")) return "APP_PROJECT";
  if (t.includes("CODE_TEMPLATE") || t === "CODE") return "CODE_TEMPLATE";
  if (t.includes("WEBXXM") || t.includes("CAPABILITY")) return "WEBXXM_PACKAGE";
  if (t.includes("WORLD")) return "WORLD_OBJECT";
  if (t.includes("MUSIC") || t.includes("SONG") || t.includes("SUNO")) return "MUSIC_OBJECT";
  if (t.includes("STORY") || t.includes("SCRIPT") || t.includes("COMIC")) return "STORY_OBJECT";
  if (t.includes("RESEARCH")) return "RESEARCH_REPORT";
  if (t.includes("STRATEGY")) return "STRATEGY_REPORT";
  if (t.includes("CALENDAR") || t.includes("TRIGGER")) return "CALENDAR_TEMPLATE";
  if (t.includes("KNOWLEDGE")) return "KNOWLEDGE_PACK";
  if (t.includes("THEME") || t.includes("UI")) return "UI_THEME";
  if (t.includes("PLUGIN")) return "PLUGIN";
  return "GENERAL_POST";
}

export function buildPublishDraftFromObject(ref: AetherObjectRef) {
  return {
    title: ref.title || "未命名作品",
    content: ref.summary || "",
    postType: mapObjectTypeToSocialType(ref.objectType),
    linkedObjectId: ref.objectId,
    linkedObjectType: ref.objectType,
  };
}
