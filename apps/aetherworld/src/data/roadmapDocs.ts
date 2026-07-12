// 版本路线图
export interface RoadmapItem {
  version: string;
  title: string;
  en: string;
  status: "Shipped" | "Current" | "Next" | "Planned";
  items: string[];
}

export const ROADMAP: RoadmapItem[] = [
  {
    version: "v0.1", title: "底层预测 OS", en: "Prediction OS Foundation",
    status: "Shipped",
    items: ["主体模型", "常数宇宙", "触发日历", "五域断事", "回验系统"],
  },
  {
    version: "v0.2", title: "多计算法内核", en: "Multi-Calculus Core",
    status: "Shipped",
    items: ["信号净化", "折域", "反冲", "共振锁定", "分支塌缩", "产品活性", "地理因素", "提示词计算"],
  },
  {
    version: "v0.3", title: "定数计算法", en: "Determinant Number",
    status: "Current",
    items: ["多计算法输出收束", "未定 / 半定 / 已定 / 反定 / 假定", "定数状态接入行动许可"],
  },
  {
    version: "v0.4", title: "回验权重进化", en: "Feedback Weight Evolution",
    status: "Next",
    items: ["回验统计", "权重修正", "个体模型更新"],
  },
  {
    version: "v0.5", title: "真实用户主体系统", en: "Real Subject System",
    status: "Planned",
    items: ["多主体管理", "私密数据隔离", "真实案例库"],
  },
  {
    version: "v1.0", title: "内测发布版", en: "Closed Beta",
    status: "Planned",
    items: ["完整体验闭环", "回验机制成熟", "小范围真实用户测试"],
  },
];
