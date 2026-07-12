// CSL 版本注册中心
// 版本 = 语法版本（grammar version）+ 启用的 feature flags

export type GrammarVersion = 'v0.8' | 'v0.9' | 'experimental';

export type FeatureFlag =
  // —— v0.9 真开 ——
  | 'functions' | 'conditionals' | 'call' | 'templates' | 'expand'
  | 'subjects' | 'sovereignty_stages' | 'stage_transitions'
  | 'compiler_layers' | 'regeneration_events' | 'signals'
  // —— 仅占位（注册但本轮 parser 不打开） ——
  | 'mapping_tables' | 'sealing' | 'colocation_chains' | 'domain_expansion'
  | 'units' | 'establishment' | 'tradeoffs' | 'engines' | 'modules'
  | 'concept_blocks' | 'proposition_blocks' | 'relation_blocks';

export const ALL_FLAGS: FeatureFlag[] = [
  'functions', 'conditionals', 'call', 'templates', 'expand',
  'subjects', 'sovereignty_stages', 'stage_transitions',
  'compiler_layers', 'regeneration_events', 'signals',
  'mapping_tables', 'sealing', 'colocation_chains', 'domain_expansion',
  'units', 'establishment', 'tradeoffs', 'engines', 'modules',
  'concept_blocks', 'proposition_blocks', 'relation_blocks',
];

export const VERSION_FEATURES: Record<GrammarVersion, FeatureFlag[]> = {
  'v0.8': [],
  'v0.9': [
    'functions', 'conditionals', 'call', 'templates', 'expand',
    'subjects', 'sovereignty_stages', 'stage_transitions',
    'compiler_layers', 'regeneration_events', 'signals',
    // —— Phase 2.3 第一梯队开闸 ——
    'concept_blocks', 'proposition_blocks', 'relation_blocks',
    'mapping_tables', 'sealing', 'colocation_chains', 'domain_expansion',
  ],
  'experimental': ALL_FLAGS,
};

export const FEATURE_LABELS: Record<FeatureFlag, string> = {
  functions: '函数',
  conditionals: '条件',
  call: '调用',
  templates: '模板',
  expand: '展开',
  subjects: '主体',
  sovereignty_stages: '主权阶段',
  stage_transitions: '阶段转移',
  compiler_layers: '编译层',
  regeneration_events: '再生事件',
  signals: '信号',
  mapping_tables: '映射表',
  sealing: '封口',
  colocation_chains: '同位链',
  domain_expansion: '域展开',
  units: '单元',
  establishment: '编制',
  tradeoffs: '权衡',
  engines: '引擎',
  modules: '模块',
  concept_blocks: '概念块',
  proposition_blocks: '命题块',
  relation_blocks: '关系块',
};

export const VERSION_LABELS: Record<GrammarVersion, string> = {
  'v0.8': 'v0.8 纯净',
  'v0.9': 'v0.9 扩展',
  'experimental': 'experimental',
};

export function isFeatureEnabled(version: GrammarVersion, flag: FeatureFlag): boolean {
  return VERSION_FEATURES[version].includes(flag);
}
