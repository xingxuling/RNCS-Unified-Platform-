import { makeCapabilityModel } from "./_makeCapabilityModel";
export const webBizM = makeCapabilityModel({
  capabilityId: "WEB_BIZ_M",
  name: "WebBizM",
  chineseName: "商业能力模型",
  domain: "BUSINESS",
  description: "商业模式、定价、PoC、销售话术、合作方案、市场定位、风险拆解。商业判断必须标记假设，不做金融承诺。",
  inputTypes: ["PRODUCT_OBJECT", "COMPANY_CONTEXT", "BUSINESS_IDEA", "MARKET_ASSUMPTION"],
  outputTypes: ["BUSINESS_PLAN_OBJECT", "POC_PLAN_OBJECT", "PRICING_DRAFT_OBJECT", "SALES_SCRIPT_OBJECT", "PARTNERSHIP_PROPOSAL_OBJECT"],
  requiredKnowledgeSources: ["BUSINESS_KNOWLEDGE", "PRODUCT_KNOWLEDGE"],
  requiredCalculusIds: ["BUSINESS_MODEL_CALCULUS"],
  requiredConstants: ["NO_FINANCIAL_PROMISE", "MARK_BUSINESS_ASSUMPTIONS"],
  toolInterfaces: ["WORKSPACE", "WEBLLM"],
  workspaceObjectTypes: ["WEB_CAPABILITY_RUN_OBJECT", "BUSINESS_PLAN_OBJECT"],
  safetyRules: ["CAP_SAFE_001", "CAP_SAFE_002", "CAP_SAFE_009", "CAP_SAFE_010"],
});
