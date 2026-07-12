import type { AgentBindingProfile } from "./agentKnowledgePersonalityBindingCalculus";

const ts = "2026-05-24T00:00:00Z";

function profile(p: Partial<AgentBindingProfile> & Pick<AgentBindingProfile, "bindingId" | "agentName" | "agentType" | "bindingPurpose">): AgentBindingProfile {
  return {
    toolType: p.agentType,
    knowledgeBinding: {
      bindingId: p.bindingId,
      enabledKnowledgeSources: ["CALCULUS_UNIVERSE", "VOCABULARY_ENCYCLOPEDIA", "PRODUCT_ENCYCLOPEDIA", "SYSTEM_CONSTITUTION", "SOFTWARE_QA_RULES"],
      requiredKnowledgeSources: ["SYSTEM_CONSTITUTION", "SOFTWARE_QA_RULES"],
      optionalKnowledgeSources: ["LEARNING_DOCS", "USAGE_EXAMPLES"],
      knowledgeScope: "TASK_SPECIFIC",
      allowedKnowledgeTypes: ["PUBLIC_DEMO", "USER_PRIVATE"],
      forbiddenKnowledgeTypes: ["FOUNDER_PRIVATE"],
      staleKnowledgePolicy: "ALLOW_WITH_WARNING",
      citationOrSourcePolicy: "必须标注 Aetherworld 知识源版本",
    },
    personalityBinding: {
      bindingId: p.bindingId,
      subjectMode: "LIGHT_20",
      personalitySource: ["LIGHT20_SEQUENCE_PROFILE", "DIGITAL_ROLE_PROFILE"],
      judgmentStyle: ["稳健", "结构化"],
      outputStyle: ["产品级", "中文优先"],
      riskPreference: "保守",
      creativityPreference: "中等",
      executionPreference: "草案 + 人工确认",
      communicationStyle: "专业克制",
      forbiddenPersonalityUses: ["身份伪装", "心理诊断", "替代真实人格"],
      privacyLevel: "USER_PRIVATE",
      safetyNotes: ["人格摘要可用；原始 Full60 不得暴露"],
    },
    calculusRouting: {
      routingId: p.bindingId,
      allowedCalculusIds: ["software-qa", "recalculation"],
      requiredCalculusIds: ["software-qa"],
      forbiddenCalculusIds: [],
      defaultCalculusId: "software-qa",
      routingPolicy: "TASK_BASED",
      fallbackCalculusIds: ["cross-functional-application"],
    },
    objectInterfaceBinding: {
      bindingId: p.bindingId,
      acceptedInputObjectTypes: [],
      producedOutputObjectTypes: ["AGENT_OUTPUT_OBJECT"],
      requiredObjectContracts: ["AGENT_CONTEXT_OBJECT"],
      workspaceSaveRequired: true,
      exportable: true,
      objectQaRequired: true,
    },
    runtimeBinding: {
      bindingId: p.bindingId,
      runtimeMode: "HUMAN_REVIEW_REQUIRED",
      requiresTrace: true,
      requiresValidation: true,
      requiresQa: true,
      requiresWorkspaceRecord: true,
      allowedRuntimeSteps: ["normalize_user_intent", "resolve_subject_mode", "load_agent_binding_profile", "bind_knowledge_layer", "bind_personality_layer", "build_agent_context", "route_calculus", "check_governance", "execute_or_prepare_agent_action", "adapt_output", "qa_check", "write_workspace_record", "mark_recalculation", "generate_next_action"],
      blockedRuntimeSteps: ["auto_deploy", "auto_delete", "auto_payment"],
    },
    governanceBinding: {
      bindingId: p.bindingId,
      constitutionRequired: true,
      qaRequired: true,
      clmRequired: true,
      permissionGuardRequired: true,
      meaningDriftCheckRequired: true,
      highRiskBlockRequired: true,
      rules: ["不得公开 Full60 原始数列", "不得公开 Founder-only", "不得伪造外部数据", "高风险动作必须人工确认"],
    },
    memoryPolicy: {
      memoryMode: "SUBJECT_MEMORY_SUMMARY",
      canReadRawSequence: false,
      canWriteMemory: true,
      canSummarizeMemory: true,
      canExportMemory: false,
      retentionPolicy: "PROJECT_SCOPED",
      privacyNotes: ["仅读取人格摘要，不读取原始数列"],
    },
    autonomyPolicy: {
      autonomyLevel: "DRAFT",
      allowedAutonomousActions: ["READ", "SUGGEST", "DRAFT"],
      actionsRequiringConfirmation: ["PUBLISH", "DEPLOY", "DELETE", "EXTERNAL_API_WRITE", "EXPORT_PRIVATE_DATA"],
      forbiddenAutonomousActions: ["OBTAIN_PASSWORD", "OBTAIN_PAYMENT_INFO", "EXECUTE_DANGEROUS_CODE", "LEAK_FOUNDER_DATA"],
    },
    allowedActions: ["READ", "SUGGEST", "DRAFT"],
    forbiddenActions: ["AUTO_PUBLISH", "AUTO_DEPLOY", "AUTO_DELETE", "LEAK_FULL60", "LEAK_FOUNDER"],
    outputProfile: "PUBLIC_SUMMARY",
    workspacePolicy: "ALWAYS_SAVE_DRAFT",
    qaRequirements: ["agent-binding-qa", "object-interface-qa", "governance-qa"],
    safetyNotes: ["默认人类审查；危险动作阻断"],
    status: "ACTIVE",
    version: "v1.0",
    createdAt: ts,
    updatedAt: ts,
    ...p,
  } as AgentBindingProfile;
}

const REGISTRY: AgentBindingProfile[] = [
  profile({ bindingId: "AETHER_APP_BUILDER_AGENT", agentName: "Aether App Builder Agent", agentType: "APP_BUILDER_AGENT", bindingPurpose: "把外部 App Builder 接入 Aetherworld，输出 App Project Object", sourceToolName: "Dyad / Lovable-class" }),
  profile({ bindingId: "AETHER_CODE_SANDBOX_AGENT", agentName: "Aether Code Sandbox Agent", agentType: "CODE_SANDBOX_AGENT", bindingPurpose: "在受限环境中执行代码草案，回写运行日志对象", sourceToolName: "E2B / OpenSandbox-class" }),
  profile({ bindingId: "AETHER_MUSIC_RUNTIME_AGENT", agentName: "Aether Music Runtime Agent", agentType: "MUSIC_GENERATION_AGENT", bindingPurpose: "把外部音乐生成模型绑定到母体数列与世界对象", sourceToolName: "ACE-Step / AudioCraft-class" }),
  profile({ bindingId: "AETHER_WORKFLOW_AGENT", agentName: "Aether Workflow Agent", agentType: "WORKFLOW_AGENT", bindingPurpose: "把外部工作流引擎绑定到数字角色与跨域计算法", sourceToolName: "Flowise / n8n-class" }),
  profile({ bindingId: "AETHER_CHATBOT_AGENT", agentName: "Aether Chatbot Agent", agentType: "CHATBOT_AGENT", bindingPurpose: "用主体人格与知识层驱动聊天机器人", sourceToolName: "OpenAssistant-class" }),
  profile({ bindingId: "AETHER_RAG_AGENT", agentName: "Aether RAG Agent", agentType: "RAG_KNOWLEDGE_AGENT", bindingPurpose: "把外部 RAG 框架绑定到词汇/产品/世界知识", sourceToolName: "LlamaIndex / LangChain-class" }),
  profile({ bindingId: "AETHER_DESIGN_AGENT", agentName: "Aether Design Agent", agentType: "DESIGN_GENERATION_AGENT", bindingPurpose: "把外部 UI/设计生成器绑定到项目风格 Profile", sourceToolName: "v0 / Builder.io-class" }),
  profile({ bindingId: "AETHER_GAME_EXPORT_AGENT", agentName: "Aether Game Export Agent", agentType: "GAME_ENGINE_AGENT", bindingPurpose: "把世界对象导出到游戏引擎工程包", sourceToolName: "Unity / Godot Export" }),
  profile({ bindingId: "AETHER_DEPLOYMENT_AGENT", agentName: "Aether Deployment Agent", agentType: "DEPLOYMENT_AGENT", bindingPurpose: "在严格人工确认下打包部署 App Project Object", sourceToolName: "Vercel / Cloudflare-class" }),
  profile({ bindingId: "AETHER_QA_AGENT", agentName: "Aether QA Agent", agentType: "QA_AGENT", bindingPurpose: "运行结构、对象与治理 QA 检查", sourceToolName: "Aetherworld Software QA" }),
];

// Domain overrides
REGISTRY.forEach((p) => {
  if (p.agentType === "APP_BUILDER_AGENT") {
    p.objectInterfaceBinding.acceptedInputObjectTypes = ["APP_IDEA_OBJECT", "PRODUCT_REQUIREMENT_OBJECT", "APP_ARCHITECTURE_OBJECT"];
    p.objectInterfaceBinding.producedOutputObjectTypes = ["APP_PROJECT_OBJECT", "FILE_TREE_OBJECT", "CODE_DRAFT_OBJECT", "PREVIEW_OBJECT", "HANDOFF_PACK_OBJECT", "QA_REPORT_OBJECT"];
    p.calculusRouting.allowedCalculusIds = ["app-runtime", "sequence-object-architecture", "digital-role", "missing-layer", "software-qa"];
    p.calculusRouting.defaultCalculusId = "app-runtime";
  }
  if (p.agentType === "CODE_SANDBOX_AGENT") {
    p.objectInterfaceBinding.acceptedInputObjectTypes = ["CODE_DRAFT_OBJECT", "APP_PROJECT_OBJECT", "TEST_PLAN_OBJECT"];
    p.objectInterfaceBinding.producedOutputObjectTypes = ["RUN_LOG_OBJECT", "ERROR_REPORT_OBJECT", "PATCH_SUGGESTION_OBJECT", "EXECUTION_RESULT_OBJECT"];
    p.calculusRouting.allowedCalculusIds = ["code-execution", "software-qa", "runtime-contract", "recalculation"];
    p.personalityBinding.personalitySource = ["PROJECT_STYLE_PROFILE"];
    p.autonomyPolicy.autonomyLevel = "EXECUTE_WITH_CONFIRMATION";
  }
  if (p.agentType === "MUSIC_GENERATION_AGENT") {
    p.objectInterfaceBinding.acceptedInputObjectTypes = ["SONG_OBJECT", "LYRIC_OBJECT", "CHARACTER_OBJECT", "WORLD_OBJECT", "VOCAL_PROMPT_OBJECT"];
    p.objectInterfaceBinding.producedOutputObjectTypes = ["AUDIO_JOB_OBJECT", "AUDIO_FILE_OBJECT", "SONG_VERSION_OBJECT", "MUSIC_QA_OBJECT"];
    p.calculusRouting.allowedCalculusIds = ["vocal", "song-object", "cross-functional-application", "meaning-drift-detection"];
  }
  if (p.agentType === "WORKFLOW_AGENT") {
    p.objectInterfaceBinding.acceptedInputObjectTypes = ["DIGITAL_WORKFLOW_OBJECT", "TASK_OBJECT", "SEQUENCE_OBJECT"];
    p.objectInterfaceBinding.producedOutputObjectTypes = ["WORKFLOW_RUN_OBJECT", "NODE_TRACE_OBJECT", "WORKFLOW_QA_OBJECT"];
    p.calculusRouting.allowedCalculusIds = ["digital-role", "cross-functional-application", "runtime-spine"];
  }
  if (p.agentType === "CHATBOT_AGENT") {
    p.calculusRouting.allowedCalculusIds = ["free-answer", "knowledge-lookup", "subject-personality", "safety-boundary"];
  }
  if (p.agentType === "RAG_KNOWLEDGE_AGENT") {
    p.calculusRouting.allowedCalculusIds = ["reality-data-calibration", "evidence-mapping", "vocabulary-lookup", "product-encyclopedia-lookup"];
    p.personalityBinding.subjectMode = "DEMO";
  }
  if (p.agentType === "DEPLOYMENT_AGENT") {
    p.runtimeBinding.runtimeMode = "HUMAN_REVIEW_REQUIRED";
    p.autonomyPolicy.autonomyLevel = "PREPARE_ACTION";
    p.forbiddenActions.push("AUTO_DEPLOY_TO_PRODUCTION");
  }
  if (p.agentType === "QA_AGENT") {
    p.autonomyPolicy.autonomyLevel = "READ_ONLY";
  }
});

export function listAgentBindings(): AgentBindingProfile[] {
  return REGISTRY;
}

export function getAgentBinding(id: string): AgentBindingProfile | undefined {
  return REGISTRY.find((p) => p.bindingId === id);
}
