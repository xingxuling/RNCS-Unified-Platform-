// Mother Sequence Language - Opcode definitions (0-9)
export interface MSLOpcode {
  digit: string;
  name: string;
  zh: string;
  meaning: string;
  bias: string[];
}

export const MSL_OPCODES: Record<string, MSLOpcode> = {
  "0": { digit: "0", name: "VOID",    zh: "归零", meaning: "归零 / 封存 / 暂停 / 空场",          bias: ["归档", "暂停", "封存", "清理"] },
  "1": { digit: "1", name: "START",   zh: "主权", meaning: "主权 / 启动 / 中心 / 第一推动",       bias: ["启动", "立中心", "确立"] },
  "2": { digit: "2", name: "LINK",    zh: "关系", meaning: "关系 / 连接 / 用户 / 社群",           bias: ["连接", "建关系", "聚人"] },
  "3": { digit: "3", name: "EXPRESS", zh: "表达", meaning: "表达 / 语言 / 符号 / 传播",           bias: ["表达", "命名", "传播"] },
  "4": { digit: "4", name: "RULE",    zh: "规则", meaning: "规则 / 边界 / 秩序 / 结构",           bias: ["立规则", "划边界", "建结构"] },
  "5": { digit: "5", name: "SHIFT",   zh: "变化", meaning: "变化 / 触发 / 显化 / 风",             bias: ["触发", "变化", "显化"] },
  "6": { digit: "6", name: "CARRY",   zh: "承载", meaning: "承载 / 生命 / 恢复 / 稳定",           bias: ["承载", "恢复", "稳态"] },
  "7": { digit: "7", name: "DEEP",    zh: "潜层", meaning: "潜层 / 隐藏 / 探索 / 深读",           bias: ["深读", "潜入", "探索"] },
  "8": { digit: "8", name: "VALUE",   zh: "资源", meaning: "资源 / 价值 / 吸附 / 资产",           bias: ["聚资源", "增值"] },
  "9": { digit: "9", name: "END",     zh: "终局", meaning: "终局 / 文明 / 收束 / 高位",           bias: ["收束", "完成", "上位"] },
};

export function getOpcode(d: string): MSLOpcode {
  return MSL_OPCODES[d] ?? { digit: d, name: "UNKNOWN", zh: "未知", meaning: "未识别操作码", bias: [] };
}
