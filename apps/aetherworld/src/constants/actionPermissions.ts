export interface ActionPermission {
  key: string;
  name: string;
  desc: string;
  tone: "go" | "hold" | "turn" | "cut" | "soft";
}

export const ACTIONS: ActionPermission[] = [
  { key: "jin",    name: "进",     desc: "适合主动推进、提交、约见", tone: "go" },
  { key: "shou",   name: "守",     desc: "保持观察、稳定现有结构",   tone: "hold" },
  { key: "zhuan",  name: "转",     desc: "切换策略、改变入口角度",   tone: "turn" },
  { key: "duan",   name: "断",     desc: "停损、切割、清理负向结构", tone: "cut" },
  { key: "fabu",   name: "发布",   desc: "适合公开表达 / 发布",      tone: "go" },
  { key: "goutong",name: "沟通",   desc: "联系关键人，主动对话",     tone: "go" },
  { key: "dengdai",name: "等待",   desc: "不宜强推，等待变量到位",   tone: "hold" },
  { key: "bucai",  name: "补材料", desc: "整理资料、申请、作品集",   tone: "soft" },
  { key: "hezuo",  name: "谈合作", desc: "适合商务沟通与协作谈判",   tone: "go" },
  { key: "qingli", name: "清理",   desc: "删除、归档、砍项目",       tone: "cut" },
  { key: "huifu",  name: "恢复",   desc: "运动、睡眠、身体修复",     tone: "soft" },
  { key: "jujue",  name: "拒绝",   desc: "拒绝不匹配机会",           tone: "cut" },
];

export const getAction = (key: string): ActionPermission =>
  ACTIONS.find((a) => a.key === key) ?? ACTIONS[1];
