import { makeCapabilityModel } from "./_makeCapabilityModel";
export const webResearchM = makeCapabilityModel({
  capabilityId: "WEB_RESEARCH_M",
  name: "WebResearchM",
  chineseName: "研究能力模型",
  domain: "RESEARCH",
  description: "资料整理、观点拆解、证据链、比较分析、研究报告草案、知识库更新。仅基于本地知识与用户提供内容，不伪造引用。",
  inputTypes: ["RESEARCH_QUESTION", "KNOWLEDGE_ITEM", "DOCUMENT_SUMMARY", "WORKSPACE_OBJECT"],
  outputTypes: ["RESEARCH_REPORT_OBJECT", "EVIDENCE_MAP_OBJECT", "COMPARISON_OBJECT", "CLAIM_OBJECT", "SOURCE_NOTE_OBJECT"],
  requiredKnowledgeSources: ["LOCAL_KNOWLEDGE_BASE", "WORKSPACE_KNOWLEDGE"],
  requiredCalculusIds: ["RESEARCH_CALCULUS"],
  requiredConstants: ["NO_SOURCE_FABRICATION", "MARK_EXTERNAL_VERIFICATION_NEEDED"],
  toolInterfaces: ["WEBLKM", "WORKSPACE", "WEBLLM"],
  workspaceObjectTypes: ["WEB_CAPABILITY_RUN_OBJECT", "RESEARCH_REPORT_OBJECT"],
  safetyRules: ["CAP_SAFE_003", "CAP_SAFE_009", "CAP_SAFE_010"],
});
