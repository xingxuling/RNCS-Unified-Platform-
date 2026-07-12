// Constant Universe v0.2 — Domain Constants (五域)
export interface DomainConstant {
  domainId: string;
  position: number;
  name: string;
  chineseName: string;
  meaning: string[];
  affectedEngines: string[];
}

export const DOMAIN_CONSTANTS: DomainConstant[] = [
  {
    domainId: "HEAVEN_DOMAIN", position: 1, name: "Heaven", chineseName: "天域",
    meaning: ["时间", "相位", "节律", "启动时机"],
    affectedEngines: ["MSL", "SequenceAI", "WorldTimeEngine", "EventScheduler"],
  },
  {
    domainId: "EARTH_DOMAIN", position: 2, name: "Earth", chineseName: "地域",
    meaning: ["场域", "环境", "承载", "世界底盘"],
    affectedEngines: ["WorldEngine", "ZoneEcology", "ResourceFlow", "Presentation"],
  },
  {
    domainId: "HUMAN_DOMAIN", position: 3, name: "Human", chineseName: "人域",
    meaning: ["用户", "NPC", "关系", "主体互动"],
    affectedEngines: ["NPCAgent", "SocialGraph", "Subject", "Narrative"],
  },
  {
    domainId: "SPIRIT_DOMAIN", position: 4, name: "Spirit", chineseName: "神域",
    meaning: ["主线", "意义", "规则", "高阶结构"],
    affectedEngines: ["WorldCanon", "Institution", "BeliefSystem", "Civilization"],
  },
  {
    domainId: "WIND_DOMAIN", position: 5, name: "Wind", chineseName: "风域",
    meaning: ["变化", "事件", "显化", "输出终端"],
    affectedEngines: ["AutonomousEvent", "PresentationRuntime", "Terminal", "Compression"],
  },
];
