// 事件查重规则与已知簇
export type DuplicateType =
  | "EXACT"
  | "SYNONYM"
  | "NEAR"
  | "PARENT_CHILD"
  | "STAGE_AS_EVENT"
  | "RISK_AS_EVENT";

export type MergeStrategy =
  | "KEEP_PRIMARY"
  | "MERGE_FIELDS"
  | "MARK_ALIAS"
  | "SPLIT_PARENT_CHILD"
  | "KEEP_BOTH";

export const SIMILARITY_THRESHOLDS = {
  /** ≥ 此值视为强重复，建议合并 */
  merge: 0.85,
  /** [near, merge) 视为近义，建议人工确认 */
  near: 0.65,
};

/** 已知重复 / 同义 / 父子关系（不强制删除任何 eventId） */
export interface KnownDuplicateCluster {
  clusterId: string;
  eventIds: string[];
  duplicateType: DuplicateType;
  recommendedPrimaryEventId: string;
  mergeStrategy: MergeStrategy;
  reason: string;
}

export const KNOWN_DUPLICATE_CLUSTERS: KnownDuplicateCluster[] = [
  {
    clusterId: "release-launch",
    eventIds: ["PRODUCT_RELEASE_WINDOW"],
    duplicateType: "SYNONYM",
    recommendedPrimaryEventId: "PRODUCT_RELEASE_WINDOW",
    mergeStrategy: "MARK_ALIAS",
    reason: "Release / Launch 在用户语言中等价；若后续出现 PRODUCT_LAUNCH_WINDOW 应直接 alias 到 PRODUCT_RELEASE_WINDOW。",
  },
  {
    clusterId: "false-signal-vs-chaos",
    eventIds: ["FALSE_SIGNAL_EVENT", "CHAOS_RISK"],
    duplicateType: "NEAR",
    recommendedPrimaryEventId: "FALSE_SIGNAL_EVENT",
    mergeStrategy: "KEEP_BOTH",
    reason: "两者均为 RISK_CHAOS 但语义不同：FALSE_SIGNAL 强调伪信号、CHAOS_RISK 强调真实乱流。保留两者，不可合并。",
  },
  {
    clusterId: "money-pressure-vs-drain",
    eventIds: ["MONEY_PRESSURE", "RESOURCE_DRAIN"],
    duplicateType: "NEAR",
    recommendedPrimaryEventId: "RESOURCE_DRAIN",
    mergeStrategy: "KEEP_BOTH",
    reason: "MONEY_PRESSURE 是 RESOURCE_DRAIN 的下位现象，可保留并标记父子关系。",
  },
  {
    clusterId: "stage-confusing",
    eventIds: [],
    duplicateType: "STAGE_AS_EVENT",
    recommendedPrimaryEventId: "",
    mergeStrategy: "KEEP_PRIMARY",
    reason: "若未来出现 *_CONFIRMING_EVENT / *_PEAKING_EVENT 等以阶段命名的事件，应映射到 eventStage 而非新增事件。",
  },
];

/** 已知父子层级（不破坏旧事件 ID） */
export interface ParentChildRelation {
  parentEventId: string;
  childEventIds: string[];
}

export const KNOWN_PARENT_CHILD: ParentChildRelation[] = [
  {
    parentEventId: "RESOURCE_DRAIN",
    childEventIds: ["MONEY_PRESSURE"],
  },
  {
    parentEventId: "RELATIONSHIP_WARMING",
    childEventIds: ["RELATIONSHIP_CONFIRMATION"],
  },
];
