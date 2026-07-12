import type { RealityScienceConstant } from "./physicsConstantsDigital";

function c(id: string, name: string, cn: string, meaning: string, positive: string, risk: string, example: string, actions: string[]): RealityScienceConstant {
  return { id, name, userFriendlyName: cn, meaning, positiveUse: positive, risk, example, relatedActions: actions };
}

export const SOCIAL_CONSTANTS_DIGITAL: RealityScienceConstant[] = [
  c("TRUST","Trust","信任","用户是否相信值得试。","真实案例。","包装过头。","空话承诺。",["真实记录"]),
  c("ADOPTION_THRESHOLD","Adoption Threshold","采用阈值","最低理解/信任。","降阈值。","门槛过高。","需读 30 页才能用。",["简化首步"]),
  c("SOCIAL_PROOF","Social Proof","社会证明","他人使用/案例。","展示真实案例。","捏造。","虚假评论。",["真实见证"]),
  c("CULTURAL_FIT","Cultural Fit","文化适配","语言/价值观匹配。","本地化。","硬翻译。","直接英译中。",["文化适配"]),
  c("NETWORK_EFFECT","Network Effect","网络效应","用户越多越有价值。","设计网络结构。","无网络结构。","纯单机使用。",["互通"]),
  c("AUTHORITY_SIGNAL","Authority Signal","权威信号","机构/专家/文档。","建立权威。","虚标。","假证书。",["真实权威"]),
  c("COMMUNITY_SPREAD","Community Spread","社群扩散","用户愿意传。","可分享物。","无分享物。","无截图卡片。",["分享物"]),
  c("MISREAD_RISK","Misread Risk","误读风险","被误解为算命/玄学。","明确边界。","暧昧表达。","术语易被神化。",["边界说明"]),
  c("ROLE_EXPECTATION","Role Expectation","角色期待","用户认为自己是谁。","定义角色。","错位。","让小白当 founder。",["角色映射"]),
  c("CO_CREATION","Co-Creation","共创","用户能否参与。","开放共创。","封闭。","完全自上而下。",["共创入口"]),
];
