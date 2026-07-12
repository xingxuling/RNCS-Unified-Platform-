export const DIGITAL_ROLE_SAFETY_RULES: { id: string; text: string }[] = [
  { id: "FOUNDER_NO_BYPASS_QA", text: "数字创始人不能绕过 QA。" },
  { id: "FOUNDER_NO_BYPASS_CONSTITUTION", text: "数字创始人不能绕过系统宪法与治理。" },
  { id: "PROGRAMMER_NO_BYPASS_QA", text: "数字程序员不能绕过 QA，不能声称已部署。" },
  { id: "PRODUCT_NO_OVERCLAIM", text: "数字产品经理不能夸大产品能力或承诺未实现功能。" },
  { id: "GROWTH_NO_FAKE_MARKETING", text: "数字增长官不能制造虚假宣传或金融化数列货币。" },
  { id: "RESEARCH_NO_FAKE_SOURCE", text: "数字研究员不能伪造来源或将未校准数据标记为 VERIFIED。" },
  { id: "WORLD_NO_REALITY_BLEED", text: "数字世界构筑师不能把虚拟世界现实化或污染 Real 数据。" },
  { id: "GOVERNANCE_NOT_OVERRIDDEN", text: "数字治理官不能被普通角色覆盖。" },
  { id: "FOUNDER_ONLY_NO_LEAK", text: "Founder-only 信息不能被普通数字角色暴露。" },
  { id: "DEMO_REAL_ISOLATION", text: "Demo 数据不能进入 Real 输出。" },
];

export const DIGITAL_ROLE_SAFETY_DISCLAIMER =
  "数字角色计算法用于将复杂任务分配给 Aetherworld 内部的数字职能体。数字角色不是现实员工、法律主体或人格替代物，而是系统内部的任务分工、协作和审计结构。所有数字角色均受 Runtime Spine、System Constitution、QA、权限隔离和 CLM 管理。数字角色输出不代表现实承诺、生产部署、法律意见、金融建议或事实验证，除非另有明确数据与审核记录。";
