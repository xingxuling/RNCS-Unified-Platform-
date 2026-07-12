// 计算法路由注册表：定义每个计算法的关键词、依赖、输出契约。
import type { CalculusId, CalculusPromptContract } from "./calculusRouteResultTypes";

export interface CalculusDefinition {
  id: CalculusId;
  domain: string;
  keywords: RegExp;
  requiredSections: string[];
  allowedOutputTypes: string[];
  suggestedTools: string[];
  forbiddenClaims: string[];
  qaRules: string[];
  nextActions: string[];
}

export const CALCULUS_REGISTRY: Record<CalculusId, CalculusDefinition> = {
  APP_RUNTIME_CALCULUS: {
    id: "APP_RUNTIME_CALCULUS",
    domain: "应用运行时",
    keywords: /(网页应用|web\s*app|做一个.*应用|prd|mvp|页面结构|文件结构|应用草案|番茄钟|todo|表单|仪表盘)/i,
    requiredSections: ["应用目标", "用户对象", "MVP 功能", "页面结构", "文件结构", "代码草案", "QA 检查", "下一步动作"],
    allowedOutputTypes: ["APP", "OBJECT", "CODE"],
    suggestedTools: ["appRuntime.createDraft", "workspace.saveObject"],
    forbiddenClaims: ["声称已部署", "声称已上线", "声称已运行真实用户流量"],
    qaRules: ["不得绕过 QA", "不得自动发布", "不得自动部署"],
    nextActions: ["创建应用草案", "保存到工作区", "进入代码沙箱检查"],
  },
  CODE_SANDBOX_CALCULUS: {
    id: "CODE_SANDBOX_CALCULUS",
    domain: "代码沙箱",
    keywords: /(代码|函数|bug|报错|修复|patch|typescript|javascript|python|编译|栈|stack trace|静态检查|lint)/i,
    requiredSections: ["问题摘要", "可能原因", "建议改动", "代码片段", "QA 复检", "下一步动作"],
    allowedOutputTypes: ["CODE", "PATCH", "QA"],
    suggestedTools: ["codeSandbox.createRun", "workspace.saveObject"],
    forbiddenClaims: ["声称代码真实运行", "执行任意 shell", "绕过 Sandbox QA"],
    qaRules: ["只允许静态检查 / 模拟运行", "不得执行宿主命令"],
    nextActions: ["创建静态检查任务", "保存补丁草案", "投递到代码沙箱"],
  },
  WORLD_ENGINE_CALCULUS: {
    id: "WORLD_ENGINE_CALCULUS",
    domain: "世界引擎",
    keywords: /(世界|区域|文明|阵营|地图|设定|宇宙观|蓝天机|秩序|大陆)/i,
    requiredSections: ["世界定位", "核心设定", "区域 / 阵营", "关键角色 / NPC", "运行规则", "下一步动作"],
    allowedOutputTypes: ["WORLD", "OBJECT"],
    suggestedTools: ["workspace.saveObject"],
    forbiddenClaims: ["破坏既有世界设定", "未经审批改写常数"],
    qaRules: ["世界对象必须可保存", "禁止重写已锁定常数"],
    nextActions: ["保存世界草稿", "进入世界引擎"],
  },
  VOCAL_ENGINE_CALCULUS: {
    id: "VOCAL_ENGINE_CALCULUS",
    domain: "声乐 / 歌曲",
    keywords: /(歌|歌词|主题曲|角色曲|suno|曲风|旋律|演唱|配乐)/i,
    requiredSections: ["歌曲定位", "角色 / 世界关联", "情绪", "曲风", "歌词结构", "Suno Prompt", "可复制版本"],
    allowedOutputTypes: ["MUSIC", "OBJECT"],
    suggestedTools: ["workspace.saveObject"],
    forbiddenClaims: ["声称已生成真实音频", "声称已发布到 Suno"],
    qaRules: ["不得包含版权侵权内容"],
    nextActions: ["保存歌曲草稿", "复制 Suno Prompt"],
  },
  NARRATIVE_CALCULUS: {
    id: "NARRATIVE_CALCULUS",
    domain: "叙事 / 剧本",
    keywords: /(剧情|故事|小说|漫画|脚本|分镜|任务文本|对白)/i,
    requiredSections: ["叙事目标", "角色与冲突", "结构 / 节奏", "正文", "下一步动作"],
    allowedOutputTypes: ["OBJECT", "TEXT"],
    suggestedTools: ["workspace.saveObject"],
    forbiddenClaims: ["声称已发布"],
    qaRules: ["不得包含敏感人物 / 政治内容"],
    nextActions: ["保存剧情草稿"],
  },
  SEQUENCE_TASK_CALCULUS: {
    id: "SEQUENCE_TASK_CALCULUS",
    domain: "数列系统",
    keywords: /(数列|sequence|msl|母序列|sequence ai|序列对象|数列世界)/i,
    requiredSections: ["数列定位", "结构 / 维度", "语义解释", "应用方向", "下一步动作"],
    allowedOutputTypes: ["OBJECT", "CONCEPT"],
    suggestedTools: ["workspace.saveObject"],
    forbiddenClaims: ["声称生成真实物理数列"],
    qaRules: ["输出必须可被 sequence-objects 引用"],
    nextActions: ["保存为数列对象"],
  },
  GOVERNANCE_CALCULUS: {
    id: "GOVERNANCE_CALCULUS",
    domain: "治理 / QA / 安全",
    keywords: /(qa|审计|宪法|安全|secret|密钥|脱敏|权限|合规|bug audit|风险)/i,
    requiredSections: ["风险摘要", "命中规则", "建议处置", "下一步动作"],
    allowedOutputTypes: ["QA", "SYSTEM"],
    suggestedTools: [],
    forbiddenClaims: ["输出原始密钥", "建议绕过 Secret Guard"],
    qaRules: ["必须服从 Secret Guard 与 System Constitution"],
    nextActions: ["打开 Bug Audit", "查看 QA 规则"],
  },
  CALENDAR_TRIGGER_CALCULUS: {
    id: "CALENDAR_TRIGGER_CALCULUS",
    domain: "日历 / 触发",
    keywords: /(提醒|日历|周期|到期|定时|明天|后天|下周|每天|每周|cron)/i,
    requiredSections: ["事件描述", "时间", "重复策略", "下一步动作"],
    allowedOutputTypes: ["OBJECT", "SYSTEM"],
    suggestedTools: ["calendar.createTask"],
    forbiddenClaims: ["声称已发送真实通知"],
    qaRules: ["时间不明确时不得自动创建"],
    nextActions: ["创建提醒", "打开日历"],
  },
  SOCIAL_PUBLISH_CALCULUS: {
    id: "SOCIAL_PUBLISH_CALCULUS",
    domain: "社交发布",
    keywords: /(发布|发到社交|社交草稿|动态|分享|发帖)/i,
    requiredSections: ["作品定位", "可见性", "文案", "风险检查", "下一步动作"],
    allowedOutputTypes: ["OBJECT", "STORE"],
    suggestedTools: ["social.createDraft"],
    forbiddenClaims: ["声称已公开发布"],
    qaRules: ["默认创建 PRIVATE 草稿", "禁止自动 PUBLIC"],
    nextActions: ["创建社交草稿"],
  },
  STORE_CAPABILITY_CALCULUS: {
    id: "STORE_CAPABILITY_CALCULUS",
    domain: "能力商店",
    keywords: /(商店|插件|能力包|webxxm|安装|启用|模型包)/i,
    requiredSections: ["能力定位", "推荐包", "风险", "下一步动作"],
    allowedOutputTypes: ["STORE"],
    suggestedTools: ["store.openPackage"],
    forbiddenClaims: ["声称已自动安装高权限包"],
    qaRules: ["高权限包必须人工确认"],
    nextActions: ["打开能力包详情"],
  },
  SEQUENCE_PREDICTION_CALCULUS: {
    id: "SEQUENCE_PREDICTION_CALCULUS",
    domain: "数列预测",
    keywords: /(预测一下|推演一下|用数列预测|数列预测|未来.{0,8}(怎样|风险|趋势)|接下来.{0,4}(怎样|如何)|当前状态|下一步该做什么|会不会成功|(7|14|30)\s*天.{0,8}(如何|预测|趋势)|3\s*个月.{0,8}(如何|预测))/,
    requiredSections: ["预测对象", "当前数列状态", "五域状态", "变量", "未来轨迹", "行动许可", "复查节点", "安全说明"],
    allowedOutputTypes: ["OBJECT", "TEXT", "SYSTEM"],
    suggestedTools: ["workspace.saveObject", "calendar.createTask"],
    forbiddenClaims: [
      "保证成功", "保证收益", "绝对化未来",
      "替代医生 / 律师 / 财务顾问",
      "给出股票 / 加密货币买卖指令",
      "声称数学确定性概率",
    ],
    qaRules: [
      "必须标注「结构化辅助判断」",
      "高风险领域必须 WARN",
      "金融场景禁止买卖指令",
      "不得替代专业意见",
    ],
    nextActions: ["保存预测报告", "创建复查提醒", "继续推演"],
  },
};

export function buildContractFromDefinition(defs: CalculusDefinition[]): CalculusPromptContract {
  const primary = defs[0];
  const merge = <T,>(get: (d: CalculusDefinition) => T[]) =>
    Array.from(new Set(defs.flatMap(get)));
  return {
    calculusIds: defs.map((d) => d.id),
    primaryCalculusId: primary.id,
    domain: defs.map((d) => d.domain).join(" / "),
    allowedOutputTypes: merge((d) => d.allowedOutputTypes),
    requiredSections: merge((d) => d.requiredSections),
    forbiddenClaims: merge((d) => d.forbiddenClaims),
    qaRules: merge((d) => d.qaRules),
    suggestedTools: merge((d) => d.suggestedTools),
    nextActions: merge((d) => d.nextActions),
  };
}
