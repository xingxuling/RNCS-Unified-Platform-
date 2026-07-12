export type ValueUnitId =
  | "AETHER_CREDIT"
  | "SEQUENCE_CREDIT"
  | "CREATION_POINT"
  | "VALIDATION_POINT"
  | "KNOWLEDGE_POINT"
  | "WORLD_RESOURCE"
  | "FOUNDER_CREDIT";

export interface ValueUnit {
  id: ValueUnitId;
  name: string;
  userFriendlyName: string;
  description: string;
  isRealCurrency: false;
  transferable: false;
  redeemableForCash: false;
  investmentAsset: false;
  allowedUses: string[];
  forbiddenUses: string[];
  founderOnly?: boolean;
}

export const VALUE_UNITS: ValueUnit[] = [
  {
    id: "AETHER_CREDIT",
    name: "Aether Credit",
    userFriendlyName: "以太积分",
    description: "通用内部积分，用于记录用户贡献与任务奖励。",
    isRealCurrency: false, transferable: false, redeemableForCash: false, investmentAsset: false,
    allowedUses: ["内部贡献记录", "任务奖励", "等级展示"],
    forbiddenUses: ["提现", "兑换法币", "公开交易", "投资凭证"],
  },
  {
    id: "SEQUENCE_CREDIT",
    name: "Sequence Credit",
    userFriendlyName: "数列积分",
    description: "与 MSL、数列解释、数列模型生成相关。",
    isRealCurrency: false, transferable: false, redeemableForCash: false, investmentAsset: false,
    allowedUses: ["MSL 解释贡献", "数列模型生成", "解锁高级数列示例"],
    forbiddenUses: ["提现", "证券化", "公开交易"],
  },
  {
    id: "CREATION_POINT",
    name: "Creation Point",
    userFriendlyName: "创造点",
    description: "剧情、世界、声乐、模型、Prompt、代码计划等创造行为。",
    isRealCurrency: false, transferable: false, redeemableForCash: false, investmentAsset: false,
    allowedUses: ["创造贡献", "资产模板权重", "创作者等级"],
    forbiddenUses: ["现实交易", "投资承诺"],
  },
  {
    id: "VALIDATION_POINT",
    name: "Validation Point",
    userFriendlyName: "回验点",
    description: "用户完成回验、反馈结果、修正模型。",
    isRealCurrency: false, transferable: false, redeemableForCash: false, investmentAsset: false,
    allowedUses: ["回验记录", "修正反馈", "提升资产可信度"],
    forbiddenUses: ["现实交易", "投资承诺"],
  },
  {
    id: "KNOWLEDGE_POINT",
    name: "Knowledge Point",
    userFriendlyName: "知识点",
    description: "新增知识条目、百科、术语、引用资料。",
    isRealCurrency: false, transferable: false, redeemableForCash: false, investmentAsset: false,
    allowedUses: ["知识贡献", "术语锁定", "百科写入"],
    forbiddenUses: ["现实交易", "投资承诺"],
  },
  {
    id: "WORLD_RESOURCE",
    name: "World Resource",
    userFriendlyName: "世界资源",
    description: "虚拟世界内部资源，例如风晶、星尘、档案碎片、规则石等。",
    isRealCurrency: false, transferable: false, redeemableForCash: false, investmentAsset: false,
    allowedUses: ["虚拟世界资源", "任务激励", "剧情/世界生成"],
    forbiddenUses: ["现实交易", "投资承诺", "兑换现实资产"],
  },
  {
    id: "FOUNDER_CREDIT",
    name: "Founder Credit",
    userFriendlyName: "创始人信用",
    description: "Founder Mode 内部审计用，不对普通用户展示。",
    isRealCurrency: false, transferable: false, redeemableForCash: false, investmentAsset: false,
    allowedUses: ["系统级审计", "Founder 模拟"],
    forbiddenUses: ["现实交易", "投资承诺", "公开"],
    founderOnly: true,
  },
];

export function getValueUnit(id: ValueUnitId): ValueUnit | undefined {
  return VALUE_UNITS.find((u) => u.id === id);
}
