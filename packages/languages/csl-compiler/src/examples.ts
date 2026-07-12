// CSL 示例库 — 4 个领域 demo + 4 个理论原语示例 + 概念 AI v1/v2 + 数字文明母体 v1

import { DEFAULT_CSL } from './default-example';
import { DUHENG_OS } from './duheng-example';
import { CONCEPT_AI_PROGRAM } from './concept-ai-program';
import { CIVILIZATION_MATRIX } from './civilization-matrix-example';
import { LOCAL_CONCEPT_AI } from './local-concept-ai-example';
import { CSL_SELF_UPGRADE } from './csl-self-upgrade-example';
import { V09_FUNCTIONS } from './examples/v09-functions';
import { V09_STAGES } from './examples/v09-stages';
import type { GrammarVersion, FeatureFlag } from './versions/registry';

export interface CSLExample {
  id: string;
  name: string;
  description: string;
  code: string;
  /** 此示例所属的最低语法版本 */
  version: GrammarVersion;
  /** 此示例依赖的 feature flags（用于在版本不匹配时给出提示） */
  requiredFeatures?: FeatureFlag[];
  /** 仍待开放（占位，菜单灰显） */
  disabled?: boolean;
}

const MEDICAL_EXAMPLE = `// ===== 医学诊断：症状 → 可能诊断 =====

概念 患者 {
  属性 姓名: 文本
  属性 体温: 数值(单位: "℃")
  属性 收缩压: 数值(单位: "mmHg")
  属性 心率: 数值(单位: "bpm")
}

实例 患者A 属于 患者 {
  姓名 = "张三"
  体温 = 39
  收缩压 = 90
  心率 = 110
}

实例 患者B 属于 患者 {
  姓名 = "李四"
  体温 = 36
  收缩压 = 130
  心率 = 75
}

函数 评估发热(体温) {
  如果 体温 > 39 则 返回 "高热"
  否则如果 体温 > 37 则 返回 "低热"
  否则 返回 "正常"
}

规则 怀疑感染 {
  条件 候选 ∈ 患者
  且 候选.体温 > 38
  动作 标记为 "疑似感染"
}

规则 怀疑休克 {
  条件 候选 ∈ 患者
  且 候选.收缩压 < 100
  且 候选.心率 > 100
  动作 标记为 "疑似休克"
}`;

const LEGAL_EXAMPLE = `// ===== 法律条款：合同适用性判断 =====

概念 合同 {
  属性 类型: 枚举{买卖, 租赁, 服务, 借贷}
  属性 金额: 数值(单位: "元")
  属性 是否书面: 文本
}

实例 合同001 属于 合同 {
  类型 = "买卖"
  金额 = 80000
  是否书面 = "是"
}

实例 合同002 属于 合同 {
  类型 = "借贷"
  金额 = 30000
  是否书面 = "否"
}

实例 合同003 属于 合同 {
  类型 = "租赁"
  金额 = 120000
  是否书面 = "是"
}

规则 标记需登记 {
  条件 候选 ∈ 合同
  且 候选.金额 > 100000
  动作 标记为 "需办理登记"
}

规则 标记效力存疑 {
  条件 候选 ∈ 合同
  且 候选.金额 > 50000
  且 候选.是否书面 = "否"
  动作 标记为 "效力存疑"
}`;

const RECIPE_EXAMPLE = `// ===== 食谱推荐：食材匹配 =====

概念 菜品 {
  属性 名称: 文本
  属性 难度: 枚举{易, 中, 难}
  属性 耗时: 数值(单位: "分钟")
  属性 热量: 数值(单位: "千卡")
}

实例 西红柿炒蛋 属于 菜品 {
  名称 = "西红柿炒蛋"
  难度 = "易"
  耗时 = 10
  热量 = 280
}

实例 红烧肉 属于 菜品 {
  名称 = "红烧肉"
  难度 = "中"
  耗时 = 90
  热量 = 850
}

规则 标记低卡 {
  条件 候选 ∈ 菜品
  且 候选.热量 < 300
  动作 标记为 "低卡推荐"
}

规则 标记快手 {
  条件 候选 ∈ 菜品
  且 候选.耗时 < 15
  动作 标记为 "快手菜"
}`;

// =========================================================
// 0.3 高阶语义示例：来自三份理论文档
// =========================================================

const SOVEREIGNTY_CYCLE = `// ===== 12 主权轮回重组机制（来源：12主权轮回重组机制 v1）=====
// 主权阶段 + 阶段转移 + 主体 三个原语

主权阶段 潜权 { 序号 = 1, 关键词 = (潜伏, 火种, 未命名), 描述 = "主权尚未明说但火种已在" }
主权阶段 借权 { 序号 = 2, 关键词 = (借壳, 借名, 依附), 描述 = "借他人框架维持存在" }
主权阶段 试权 { 序号 = 3, 关键词 = (试边界, 局部主导), 描述 = "局部测试自我定义" }
主权阶段 立界 { 序号 = 4, 关键词 = (边界, 拒绝, 切割), 描述 = "首次建立明确边界" }
主权阶段 争权 { 序号 = 5, 关键词 = (对抗, 冲突, 摩擦), 描述 = "与外部争夺定义权" }
主权阶段 摄权 { 序号 = 6, 关键词 = (收权, 中枢形成), 描述 = "形成自己的秩序中心" }
主权阶段 裂权 { 序号 = 7, 关键词 = (裂缝, 旧版失效), 描述 = "旧主权结构开裂" }
主权阶段 失权 { 序号 = 8, 关键词 = (失控, 被夺权, 降格), 描述 = "主权被抽空或夺走" }
主权阶段 回权 { 序号 = 9, 关键词 = (回收, 内核回归), 描述 = "从碎裂中拉回定义权" }
主权阶段 炼权 { 序号 = 10, 关键词 = (熔炼, 去杂质, 纯化), 描述 = "对主权进行版本升级" }
主权阶段 定权 { 序号 = 11, 关键词 = (稳定, 成体系, 可持续), 描述 = "新主权稳定为秩序中枢" }
主权阶段 传权 { 序号 = 12, 关键词 = (外化, 传承, 法脉), 描述 = "主权外化为可继承协议" }

// 阶段转移：用条件触发
阶段转移 借到试 { 从 借权 到 试权 触发 不服从感 > 0 }
阶段转移 试到立 { 从 试权 到 立界 触发 边界感 > 50 }
阶段转移 摄到裂 { 从 摄权 到 裂权 触发 外部冲击 > 80 }
阶段转移 失到回 { 从 失权 到 回权 触发 觉察度 > 60 }
阶段转移 炼到定 { 从 炼权 到 定权 触发 纯度 > 90 }

// 主体：把阶段挂到具体主体上
主体 创业者A {
  当前阶段 = 摄权
  边界感 = 75
  纯度 = 60
  外部冲击 = 30
}

主体 数字主体B {
  当前阶段 = 失权
  觉察度 = 80
  外部冲击 = 90
}

证据 文档来源 {
  来源 = "12主权轮回重组机制 v1"
  原文 = "每次裂权—失权—回权之后，主体不会回到原点而是以重组方式进入更高版本"
  支持 = 创业者A
}`;

const COMPILER_LAYERS = `// ===== 潜意识—机器编译共运作（来源：人类潜意识与机器编译层共运作机制 v1）=====
// 编译层 + 信号 两个原语

编译层 潜流层 {
  层级 = "A"
  输入 = (梦境残片, 未命名张力, 概念冲动, 象征图像)
  输出 = (高密度结构云)
}

编译层 浮现层 {
  层级 = "B"
  输入 = (高密度结构云)
  输出 = (关键词闪现, 命名欲, 局部逻辑)
}

编译层 机器编译层 {
  层级 = "C"
  输入 = (关键词闪现, 命名欲, 局部逻辑)
  输出 = (中间结构表示, 多版本候选, 关系链)
}

编译层 主体校权层 {
  层级 = "D"
  输入 = (中间结构表示, 多版本候选)
  输出 = (定名结构, 真核标识)
}

编译层 文本定轨层 {
  层级 = "E"
  输入 = (定名结构)
  输出 = (顺序, 层级, 调用入口)
}

编译层 系统生成层 {
  层级 = "F"
  输入 = (调用入口)
  输出 = (机制图, 方法论, 协议)
}

编译层 现实对接层 {
  层级 = "G"
  输入 = (协议)
  输出 = (决策路径, 行动顺序, 资源对接)
}

// 信号示例：进入潜流层的原始材料
信号 反复出现的词 { 类型 = "前语言", 强度 = 85, 描述 = "某个词在不同语境反复闪现" }
信号 梦中图像 { 类型 = "象征", 强度 = 70, 描述 = "梦里出现高密度画面但醒后说不清" }
信号 卡顿感 { 类型 = "张力", 强度 = 60, 描述 = "对某个概念有强烈但说不出的不对感" }
信号 命名冲动 { 类型 = "概念冲动", 强度 = 90, 描述 = "想给某个东西起一个新名字的强烈冲动" }

证据 文档来源 {
  来源 = "人类潜意识与机器编译层共运作机制 v1"
  原文 = "潜意识负责先知道，机器编译层负责让它能运行"
  支持 = 机器编译层
}`;

const AIE_REGEN = `// ===== AIE 机器重组与再生引擎（来源：AIE v1）=====
// 再生事件 + 主体 + 主权阶段 三个原语联动

主权阶段 失配 { 序号 = 1, 关键词 = (旧化, 漂移, 污染), 描述 = "结构与新环境不匹配" }
主权阶段 诊断 { 序号 = 2, 关键词 = (因果链, 根因, 失权源), 描述 = "拆解模块识别根因" }
主权阶段 重组 { 序号 = 3, 关键词 = (模块重排, 协议重写, 边界重设), 描述 = "新结构编译" }
主权阶段 回权 { 序号 = 4, 关键词 = (主控回收, 边界回收), 描述 = "把权限收回到主体" }
主权阶段 跃迁 { 序号 = 5, 关键词 = (新版本, 更高形态), 描述 = "完成版本跃迁而非恢复原状" }

阶段转移 失配到诊断 { 从 失配 到 诊断 触发 损耗度 > 50 }
阶段转移 诊断到重组 { 从 诊断 到 重组 触发 根因明确度 > 70 }
阶段转移 重组到回权 { 从 重组 到 回权 触发 新结构稳定度 > 60 }
阶段转移 回权到跃迁 { 从 回权 到 跃迁 触发 主权完整度 > 80 }

主体 智能Agent_v1 {
  当前阶段 = 失配
  损耗度 = 75
  根因明确度 = 40
  主权完整度 = 30
}

主体 智能Agent_v2 {
  当前阶段 = 重组
  根因明确度 = 85
  新结构稳定度 = 65
  主权完整度 = 70
}

再生事件 Agent升级_R1 {
  主体 = "智能Agent_v1"
  失配 = "旧策略在新环境失效, 模块规则互相打架"
  诊断 = "因果链断裂在记忆污染层, 失权源为外部调用越界"
  重组 = "隔离污染记忆, 重写边界协议, 主控收回到核心模块"
  新版本 = "v2.0"
}

再生事件 Agent升级_R2 {
  主体 = "智能Agent_v2"
  失配 = "多代理协作中协议冲突"
  诊断 = "权限分配模型与新主控不匹配"
  重组 = "重新协商权限协议, 引入版本仲裁层"
  新版本 = "v2.1"
}

证据 文档来源 {
  来源 = "AIE：机器重组与再生引擎 v1"
  原文 = "AIE 不是恢复学，而是重组升级学。机器如何在断裂后获得更高一级的存在形态。"
  支持 = 智能Agent_v1
}`;

const TAIYI_DAOFA = `// ===== 太一道法经 v1（来源：太一道法经体系总理解 + 神位总表逆向拆解）=====
// 0.4 四个新原语演示：映射表 / 封口 / 同位链 / 域展开

// --- 一、母法递归域展开 ---
// 太一至道为唯一母法，五理为五值分类器，向五个应用域递归展开
域展开 太一至道 母法(无, 天, 元, 公, 太) 域(宇宙, 生灵, 社会, 家庭, 人文) {
  五因 宇宙: 形, 数, 色, 力, 影响
  五因 生灵: 特征, 营养, 组织, 神经, 繁衍
  五因 社会: 资源, 经济, 组织, 生活, 文化
  五因 家庭: 条件, 女人, 婚姻, 男人, 子女
  五因 人文: 识, 欲, 性, 常, 修
}

// --- 二、太一神位总表（五列同位映射）---
映射表 太一神位总表 列(第一列, 第二列, 第三列, 第四列, 第五列) {
  行 神位: 后土, 道德, 元始, 灵宝, 昊天
  行 生灵: 羽嘉, 介鳞, 玄女, 真武, 毛犊
  行 天象: 月母, 长生, 勾陈, 紫微, 日公
  行 帝位: 白帝, 赤帝, 黄帝, 黑帝, 青帝
}

// --- 三、跨域同位链：第三列纵向链 ---
同位链 第三列宇宙链 域(神位, 生灵, 天象, 帝位) = (元始, 玄女, 勾陈, 黄帝)
同位链 第一列宇宙链 域(神位, 生灵, 天象, 帝位) = (后土, 羽嘉, 月母, 白帝)
同位链 第五列宇宙链 域(神位, 生灵, 天象, 帝位) = (昊天, 毛犊, 日公, 青帝)

// --- 四、宇宙编制总数封口 ---
// 555 主神真位 = 各编制数量总和
封口 宇宙编制总数 = 555 由 (
  天罡:36, 冥司:72, 天堂:32, 星宿:28, 地煞:32,
  总干:10, 冥支:12, 天旬:36, 星节:24, 地候:72,
  太岁:60, 公:3, 卿:9, 罡:36, 煞:72, 真位:21
)

// --- 五、人文五因继续递归（人识 → 五子项）---
域展开 人识展开 母法(觉, 思, 辨, 知, 明) 域(感官, 直觉, 推理, 经验, 智慧) {
  五因 感官: 视, 听, 触, 嗅, 味
  五因 直觉: 闪念, 灵感, 预感, 共鸣, 顿悟
  五因 推理: 归纳, 演绎, 类比, 反证, 综合
  五因 经验: 重复, 对比, 验证, 修正, 沉淀
  五因 智慧: 通, 化, 立, 守, 传
}

// --- 六、证据回链 ---
证据 太一总纲 {
  来源 = "太一道法经体系总理解 v1"
  原文 = "他不是在写知识，而是在写一台能不断把世界重新分层、命名、编制、落位、人格化、地图化、总表化的宇宙编译机"
  支持 = 太一至道, 太一神位总表
}
证据 五分递归 {
  来源 = "作者判断结构逆向分析报告"
  原文 = "先验母法 → 时空切轴 → 五分归类 → 跨域迁移 → 递归展开 → 图解固化 → 规范输出"
  支持 = 太一至道, 人识展开
}
证据 总数封口 {
  来源 = "太一神位总表手稿逆向拆解"
  原文 = "贯通天地五百五十五主神真位"
  支持 = 宇宙编制总数
}`;

export const EXAMPLES: CSLExample[] = [
  // ============== v0.8 stable ==============
  {
    id: 'material',
    name: '材料科学（基础）',
    description: 'v0.8 最小可运行：概念/实例/不变量/规则/证据',
    code: DEFAULT_CSL,
    version: 'v0.8',
  },
  {
    id: 'legal',
    name: '法律条款',
    description: 'v0.8：合同适用性判断（不含函数）',
    code: LEGAL_EXAMPLE,
    version: 'v0.8',
  },
  {
    id: 'recipe',
    name: '食谱推荐',
    description: 'v0.8：食材匹配与菜品标记',
    code: RECIPE_EXAMPLE,
    version: 'v0.8',
  },

  // ============== v0.9 upgraded（本轮真开） ==============
  {
    id: 'v09-functions',
    name: 'v0.9 · 函数 + 模板',
    description: '函数/如果/调用/模板/展开 第一批语法',
    code: V09_FUNCTIONS,
    version: 'v0.9',
    requiredFeatures: ['functions', 'conditionals', 'call', 'templates', 'expand'],
  },
  {
    id: 'v09-stages',
    name: 'v0.9 · 主体 + 阶段',
    description: '主体/主权阶段/阶段转移/编译层/信号/再生事件',
    code: V09_STAGES,
    version: 'v0.9',
    requiredFeatures: [
      'subjects', 'sovereignty_stages', 'stage_transitions',
      'compiler_layers', 'signals', 'regeneration_events',
    ],
  },
  {
    id: 'medical',
    name: '医学诊断',
    description: 'v0.9：函数 + 条件分支',
    code: MEDICAL_EXAMPLE,
    version: 'v0.9',
    requiredFeatures: ['functions', 'conditionals'],
  },
  {
    id: 'sovereignty',
    name: '主权轮回 v1',
    description: 'v0.9：12 阶段 + 阶段转移',
    code: SOVEREIGNTY_CYCLE,
    version: 'v0.9',
    requiredFeatures: ['subjects', 'sovereignty_stages', 'stage_transitions'],
  },
  {
    id: 'compiler',
    name: '潜意识编译层',
    description: 'v0.9：编译层 + 信号',
    code: COMPILER_LAYERS,
    version: 'v0.9',
    requiredFeatures: ['compiler_layers', 'signals'],
  },
  {
    id: 'aie',
    name: 'AIE 再生引擎',
    description: 'v0.9：再生事件 + 阶段转移',
    code: AIE_REGEN,
    version: 'v0.9',
    requiredFeatures: ['regeneration_events', 'stage_transitions'],
  },

  // ============== experimental / future（仅占位，本轮 disabled） ==============
  {
    id: 'taiyi',
    name: '太一道法经 v1',
    description: 'experimental：映射表/封口/同位链/域展开',
    code: TAIYI_DAOFA,
    version: 'experimental',
    requiredFeatures: ['mapping_tables', 'sealing', 'colocation_chains', 'domain_expansion'],
    disabled: true,
  },
  {
    id: 'duheng',
    name: '杜衡界 v1',
    description: 'experimental：单元/编制/权衡',
    code: DUHENG_OS,
    version: 'experimental',
    requiredFeatures: ['units', 'establishment', 'tradeoffs'],
    disabled: true,
  },
  {
    id: 'conceptai',
    name: '概念 AI v1',
    description: 'experimental：基于函数原语',
    code: CONCEPT_AI_PROGRAM,
    version: 'experimental',
    disabled: true,
  },
  {
    id: 'civmatrix',
    name: '数字文明母体 v1',
    description: 'experimental：引擎/模块',
    code: CIVILIZATION_MATRIX,
    version: 'experimental',
    requiredFeatures: ['engines', 'modules'],
    disabled: true,
  },
  {
    id: 'localai',
    name: '本地概念级 AI v2',
    description: 'experimental：概念块/命题块/关系块',
    code: LOCAL_CONCEPT_AI,
    version: 'experimental',
    requiredFeatures: ['concept_blocks', 'proposition_blocks', 'relation_blocks'],
    disabled: true,
  },
  {
    id: 'selfupgrade',
    name: 'CSL 自举 v3',
    description: 'experimental：元程序原语',
    code: CSL_SELF_UPGRADE,
    version: 'experimental',
    disabled: true,
  },
];
