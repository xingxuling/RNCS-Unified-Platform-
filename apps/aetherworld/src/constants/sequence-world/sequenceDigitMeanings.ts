// 数列数字含义 · 0-9
export interface DigitMeaning {
  digit: string;
  keyword: string;
  themes: string[];
  domainHint: string;
}

export const SEQUENCE_DIGIT_MEANINGS: Record<string, DigitMeaning> = {
  "0": { digit: "0", keyword: "归零·虚空", themes: ["封存","暂停","黑场","冻结","清理"], domainHint: "void" },
  "1": { digit: "1", keyword: "主权·启动", themes: ["方向","中心","第一推动","权威"], domainHint: "heaven" },
  "2": { digit: "2", keyword: "关系·连接", themes: ["互动","NPC","社群","耦合"], domainHint: "human" },
  "3": { digit: "3", keyword: "表达·符号", themes: ["语言","传播","界面","信息流"], domainHint: "human" },
  "4": { digit: "4", keyword: "规则·边界", themes: ["秩序","结构","制度","边界"], domainHint: "earth" },
  "5": { digit: "5", keyword: "变化·风", themes: ["触发","转向","事件","显化"], domainHint: "wind" },
  "6": { digit: "6", keyword: "承载·生命", themes: ["恢复","稳定","生物性","柔性"], domainHint: "earth" },
  "7": { digit: "7", keyword: "潜意识·深读", themes: ["隐藏层","迷雾","探索","幽影"], domainHint: "spirit" },
  "8": { digit: "8", keyword: "资源·重力", themes: ["商业","价值","吸附","资产"], domainHint: "earth" },
  "9": { digit: "9", keyword: "终局·文明", themes: ["高位","仪式","收束","神域"], domainHint: "spirit" },
};

export const FIVE_DOMAIN_POSITIONS = [
  { index: 0, key: "heaven", label: "天域", role: "时间 / 相位 / 节律" },
  { index: 1, key: "earth",  label: "地域", role: "场域 / 环境 / 承载" },
  { index: 2, key: "human",  label: "人域", role: "用户 / NPC / 关系" },
  { index: 3, key: "spirit", label: "神域", role: "主线 / 意义 / 规则" },
  { index: 4, key: "wind",   label: "风域", role: "变化 / 事件 / 显化" },
];
