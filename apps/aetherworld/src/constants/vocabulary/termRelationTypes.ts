export const TERM_RELATION_TYPES = [
  { id: "IS_PARENT_OF",          label: "父级概念" },
  { id: "IS_CHILD_OF",           label: "子级概念" },
  { id: "DEPENDS_ON",            label: "依赖" },
  { id: "USED_BY",               label: "被使用" },
  { id: "IMPLEMENTS",            label: "实现" },
  { id: "EXPLAINS",              label: "解释" },
  { id: "CONTRASTS_WITH",        label: "对照" },
  { id: "MUST_NOT_CONFUSE_WITH", label: "不能混淆" },
  { id: "DERIVED_FROM",          label: "派生自" },
  { id: "BELONGS_TO",            label: "属于" },
  { id: "TRIGGERS",              label: "触发" },
  { id: "CALIBRATES",            label: "校准" },
  { id: "GOVERNED_BY",           label: "受治理" },
  { id: "EXPORTS_TO",            label: "导出到" },
  { id: "LOCALIZES_AS",          label: "本地化为" },
] as const;
export type TermRelationTypeId = (typeof TERM_RELATION_TYPES)[number]["id"];

export interface TermRelation {
  relationId: string;
  fromTermId: string;
  toTermId: string;
  relationType: TermRelationTypeId;
  explanation?: string;
  strength?: number;
}
