// Constant Universe v0.2 — Digit Constants
// 唯一数字含义来源 · 所有引擎共享 · 不得在其他模块重复硬编码
export interface DigitConstant {
  digit: string;
  opcode: string;
  chineseName: string;
  coreMeaning: string[];
  worldMeaning: string[];
  actionBias: string[];
  riskBias: string[];
  renderBias: string[];
  physicsBias: string[];
  animationBias: string[];
  narrativeBias: string[];
  societyBias: string[];
  civilizationBias: string[];
  currencyBias: string[];
  compressionBias: string[];
}

export const DIGIT_CONSTANTS: DigitConstant[] = [
  {
    digit: "0", opcode: "VOID", chineseName: "归零",
    coreMeaning: ["归零", "虚空", "封存", "暂停", "归档", "冷却"],
    worldMeaning: ["世界冷却", "归档区", "暂停帧"],
    actionBias: ["暂停", "归档", "重置"],
    riskBias: ["停滞", "信息丢失"],
    renderBias: ["黑场", "雾", "极简"],
    physicsBias: ["零重力", "静止场"],
    animationBias: ["停帧", "黑切"],
    narrativeBias: ["序章结束", "空白章"],
    societyBias: ["休眠组织"],
    civilizationBias: ["文明休眠期"],
    currencyBias: ["归档资产"],
    compressionBias: ["最小输出"],
  },
  {
    digit: "1", opcode: "START", chineseName: "启动",
    coreMeaning: ["主权", "启动", "中心", "第一推动", "创始"],
    worldMeaning: ["世界起点", "主城", "源头节点"],
    actionBias: ["发起", "创建", "立法"],
    riskBias: ["集权风险"],
    renderBias: ["中心光源", "聚焦"],
    physicsBias: ["核心引力"],
    animationBias: ["开场仪式"],
    narrativeBias: ["主角登场"],
    societyBias: ["创始集团"],
    civilizationBias: ["建国期"],
    currencyBias: ["铸造"],
    compressionBias: ["突出主结论"],
  },
  {
    digit: "2", opcode: "LINK", chineseName: "连接",
    coreMeaning: ["关系", "连接", "互动", "用户", "社群", "联盟"],
    worldMeaning: ["关系网", "联盟通道"],
    actionBias: ["缔结", "联结", "对话"],
    riskBias: ["依附", "纠缠"],
    renderBias: ["双色对照", "并列"],
    physicsBias: ["双星引力"],
    animationBias: ["镜像运动"],
    narrativeBias: ["双线叙事"],
    societyBias: ["联盟形成"],
    civilizationBias: ["邦联化"],
    currencyBias: ["双向流通"],
    compressionBias: ["对比段落"],
  },
  {
    digit: "3", opcode: "EXPRESS", chineseName: "表达",
    coreMeaning: ["表达", "语言", "符号", "传播", "文本", "界面"],
    worldMeaning: ["符号层", "传播渠道"],
    actionBias: ["发布", "宣讲", "记录"],
    riskBias: ["误传"],
    renderBias: ["文字排版", "符号铭文"],
    physicsBias: ["波动场"],
    animationBias: ["文字浮现"],
    narrativeBias: ["对白密集"],
    societyBias: ["传媒兴起"],
    civilizationBias: ["书写文明"],
    currencyBias: ["符号面值"],
    compressionBias: ["语义提炼"],
  },
  {
    digit: "4", opcode: "RULE", chineseName: "规则",
    coreMeaning: ["规则", "边界", "秩序", "制度", "审计", "结构"],
    worldMeaning: ["律法", "结构骨架"],
    actionBias: ["制定", "审计", "约束"],
    riskBias: ["僵化"],
    renderBias: ["几何网格"],
    physicsBias: ["晶格结构"],
    animationBias: ["对齐变换"],
    narrativeBias: ["法庭/裁决"],
    societyBias: ["官僚体系"],
    civilizationBias: ["制度成熟期"],
    currencyBias: ["法定货币"],
    compressionBias: ["结构化分节"],
  },
  {
    digit: "5", opcode: "SHIFT", chineseName: "变化",
    coreMeaning: ["变化", "触发", "显化", "风", "事件", "跃迁"],
    worldMeaning: ["事件场", "风带"],
    actionBias: ["触发", "切换", "迁移"],
    riskBias: ["失控"],
    renderBias: ["湍流", "粒子风"],
    physicsBias: ["高湍流"],
    animationBias: ["快切", "形变"],
    narrativeBias: ["突变情节"],
    societyBias: ["运动/起义"],
    civilizationBias: ["变革期"],
    currencyBias: ["汇率波动"],
    compressionBias: ["要点跳跃"],
  },
  {
    digit: "6", opcode: "CARRY", chineseName: "承载",
    coreMeaning: ["承载", "生命", "恢复", "稳定", "疗愈", "缓冲"],
    worldMeaning: ["生态承载", "缓冲带"],
    actionBias: ["供养", "修复", "维持"],
    riskBias: ["过度承载"],
    renderBias: ["柔光", "有机纹理"],
    physicsBias: ["稳定流体"],
    animationBias: ["缓动呼吸"],
    narrativeBias: ["疗愈线"],
    societyBias: ["福利体系"],
    civilizationBias: ["稳定期"],
    currencyBias: ["储备资产"],
    compressionBias: ["温和措辞"],
  },
  {
    digit: "7", opcode: "DEEP", chineseName: "潜层",
    coreMeaning: ["潜层", "隐藏", "梦境", "探索", "秘密", "迷雾"],
    worldMeaning: ["深渊区", "隐域"],
    actionBias: ["探索", "解密", "潜行"],
    riskBias: ["未知风险"],
    renderBias: ["浓雾", "深景深"],
    physicsBias: ["未知场"],
    animationBias: ["缓显隐"],
    narrativeBias: ["悬疑/伏笔"],
    societyBias: ["地下组织"],
    civilizationBias: ["神秘期"],
    currencyBias: ["黑市/隐资产"],
    compressionBias: ["标记不确定"],
  },
  {
    digit: "8", opcode: "VALUE", chineseName: "价值",
    coreMeaning: ["资源", "价值", "资产", "商业", "重力", "吸附"],
    worldMeaning: ["资源富集区"],
    actionBias: ["积累", "交易", "投资"],
    riskBias: ["贪婪"],
    renderBias: ["金属/重质材质"],
    physicsBias: ["高重力"],
    animationBias: ["沉降"],
    narrativeBias: ["商战线"],
    societyBias: ["商业集团"],
    civilizationBias: ["繁荣期"],
    currencyBias: ["核心资产"],
    compressionBias: ["突出价值点"],
  },
  {
    digit: "9", opcode: "END", chineseName: "终局",
    coreMeaning: ["终局", "文明", "星海", "仪式", "收束", "高位"],
    worldMeaning: ["星海", "终末殿堂"],
    actionBias: ["完结", "升格", "封神"],
    riskBias: ["僭越"],
    renderBias: ["星空", "辉光"],
    physicsBias: ["低重力高视野"],
    animationBias: ["升空", "缓慢回旋"],
    narrativeBias: ["尾章/史诗"],
    societyBias: ["神职体系"],
    civilizationBias: ["终末/升维"],
    currencyBias: ["终极估值"],
    compressionBias: ["收束总结"],
  },
];

export function getDigitConstant(digit: string | number): DigitConstant | undefined {
  return DIGIT_CONSTANTS.find((d) => d.digit === String(digit));
}
