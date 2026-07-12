export interface BreakthroughGap {
  number: number;
  name: string;
  meaning: string;
  shortage: string;
  remedy: string[];
}

export const BREAKTHROUGH_GAPS: BreakthroughGap[] = [
  { number: 0, name: "归零", meaning: "空位/重置", shortage: "不会归零，旧状态未封存", remedy: ["先停手","归档","断舍"] },
  { number: 1, name: "主权", meaning: "启动/个人意志", shortage: "谁负责不明确", remedy: ["指定负责人","写明边界","声明主张"] },
  { number: 2, name: "关系", meaning: "用户/合作/反馈", shortage: "缺用户与反馈链", remedy: ["找3位真实用户","建反馈入口","回访"] },
  { number: 3, name: "表达", meaning: "传播/语言", shortage: "讲不清，传不出", remedy: ["重写一句话","降术语","写示例"] },
  { number: 4, name: "秩序", meaning: "流程/制度", shortage: "缺流程与可信包装", remedy: ["写步骤清单","定模板","加 SOP"] },
  { number: 5, name: "触发", meaning: "变化/破局", shortage: "卡住不动", remedy: ["设小动作","发起一次试","设触发器"] },
  { number: 6, name: "承载", meaning: "稳定/恢复", shortage: "身体/系统/资源撑不住", remedy: ["降负载","恢复","扩容"] },
  { number: 7, name: "深读", meaning: "潜意识/后台", shortage: "后台逻辑没看清", remedy: ["复盘","写笔记","研究原始资料"] },
  { number: 8, name: "资源", meaning: "金钱/商业", shortage: "缺商业闭环", remedy: ["定价测试","找首付费用户","算单元经济"] },
  { number: 9, name: "终局", meaning: "长期意义", shortage: "缺长期方向", remedy: ["写愿景","定3年北极星","对齐主线"] },
];

export const getGap = (n: number) => BREAKTHROUGH_GAPS.find((g) => g.number === n);
