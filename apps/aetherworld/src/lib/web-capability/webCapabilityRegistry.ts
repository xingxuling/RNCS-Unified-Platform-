import type { WebCapabilityModel } from "./aetherWebCapabilityModels";
import type { WebCapabilityId } from "@/constants/web-capability/webCapabilityTypes";
import { webCodeM } from "./models/webCodeM";
import { webProductM } from "./models/webProductM";
import { webDesignM } from "./models/webDesignM";
import { webMusicM } from "./models/webMusicM";
import { webStoryM } from "./models/webStoryM";
import { webResearchM } from "./models/webResearchM";
import { webBizM } from "./models/webBizM";
import { webTeachM } from "./models/webTeachM";
import { webOpsM } from "./models/webOpsM";
import { webStrategyM } from "./models/webStrategyM";
import { webGameM } from "./models/webGameM";
import { webAgentM } from "./models/webAgentM";

const REGISTRY: Record<WebCapabilityId, WebCapabilityModel> = {
  WEB_CODE_M: webCodeM,
  WEB_PRODUCT_M: webProductM,
  WEB_DESIGN_M: webDesignM,
  WEB_MUSIC_M: webMusicM,
  WEB_STORY_M: webStoryM,
  WEB_RESEARCH_M: webResearchM,
  WEB_BIZ_M: webBizM,
  WEB_TEACH_M: webTeachM,
  WEB_OPS_M: webOpsM,
  WEB_STRATEGY_M: webStrategyM,
  WEB_GAME_M: webGameM,
  WEB_AGENT_M: webAgentM,
};

export function listWebCapabilityModels(): WebCapabilityModel[] {
  return Object.values(REGISTRY);
}

export function getWebCapabilityModel(id: WebCapabilityId): WebCapabilityModel | undefined {
  return REGISTRY[id];
}

export function getWebCapabilityRegistrySummary() {
  const all = listWebCapabilityModels();
  return {
    totalCapabilities: all.length,
    activeCapabilities: all.filter((c) => c.status === "ACTIVE").length,
    draftCapabilities: all.filter((c) => c.status === "DRAFT").length,
    reviewNeeded: all.filter((c) => c.status === "REVIEW_NEEDED").length,
  };
}
