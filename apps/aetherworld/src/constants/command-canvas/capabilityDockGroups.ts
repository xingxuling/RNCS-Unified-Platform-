export interface DockCard { id: string; label: string; route: string; group: string; }
export const CAPABILITY_DOCK_GROUPS: { id: string; label: string; cards: DockCard[] }[] = [
  { id: "CORE_MODELS", label: "Core Models", cards: [
    { id: "WEBLKM", label: "WebLKM", route: "/weblkm-runtime", group: "CORE_MODELS" },
    { id: "WEBCM",  label: "WebCM",  route: "/webcm-runtime",  group: "CORE_MODELS" },
    { id: "WEBCOM", label: "WebCoM", route: "/webcom-runtime", group: "CORE_MODELS" },
    { id: "WEBLCM", label: "WebLCM", route: "/weblcm-runtime", group: "CORE_MODELS" },
    { id: "WEBLLM", label: "WebLLM", route: "/webllm-runtime", group: "CORE_MODELS" },
    { id: "WEBLWM", label: "WebLWM", route: "/world-runtime", group: "CORE_MODELS" },
  ]},
  { id: "HUMAN_CAPABILITIES", label: "Human Capabilities", cards: [
    { id: "WEB_CODE_M", label: "WebCodeM", route: "/web-capability-run", group: "HUMAN_CAPABILITIES" },
    { id: "WEB_PRODUCT_M", label: "WebProductM", route: "/web-capability-run", group: "HUMAN_CAPABILITIES" },
    { id: "WEB_DESIGN_M", label: "WebDesignM", route: "/web-capability-run", group: "HUMAN_CAPABILITIES" },
    { id: "WEB_MUSIC_M", label: "WebMusicM", route: "/web-capability-run", group: "HUMAN_CAPABILITIES" },
    { id: "WEB_STORY_M", label: "WebStoryM", route: "/web-capability-run", group: "HUMAN_CAPABILITIES" },
    { id: "WEB_RESEARCH_M", label: "WebResearchM", route: "/web-capability-run", group: "HUMAN_CAPABILITIES" },
    { id: "WEB_BIZ_M", label: "WebBizM", route: "/web-capability-run", group: "HUMAN_CAPABILITIES" },
    { id: "WEB_TEACH_M", label: "WebTeachM", route: "/web-capability-run", group: "HUMAN_CAPABILITIES" },
    { id: "WEB_OPS_M", label: "WebOpsM", route: "/web-capability-run", group: "HUMAN_CAPABILITIES" },
    { id: "WEB_STRATEGY_M", label: "WebStrategyM", route: "/web-capability-run", group: "HUMAN_CAPABILITIES" },
    { id: "WEB_GAME_M", label: "WebGameM", route: "/web-capability-run", group: "HUMAN_CAPABILITIES" },
    { id: "WEB_AGENT_M", label: "WebAgentM", route: "/web-capability-run", group: "HUMAN_CAPABILITIES" },
  ]},
  { id: "RUNTIMES", label: "Runtimes", cards: [
    { id: "APP_RUNTIME", label: "App Runtime", route: "/app-runtime", group: "RUNTIMES" },
    { id: "CODE_SANDBOX", label: "Code Sandbox", route: "/code-sandbox", group: "RUNTIMES" },
    { id: "PROMPT_FORGE", label: "Prompt Forge", route: "/abstract-prompt-forge", group: "RUNTIMES" },
    { id: "EXPORT", label: "Export", route: "/engine-export", group: "RUNTIMES" },
    { id: "WORKSPACE", label: "Workspace", route: "/app-projects", group: "RUNTIMES" },
  ]},
  { id: "GOVERNANCE", label: "Governance", cards: [
    { id: "QA", label: "QA", route: "/system-audit", group: "GOVERNANCE" },
    { id: "CONSTITUTION", label: "Constitution", route: "/system-constitution", group: "GOVERNANCE" },
    { id: "VERSION_LEAP", label: "Version Leap", route: "/version-leap", group: "GOVERNANCE" },
    { id: "RECALCULATION", label: "Recalculation", route: "/reality-calibration", group: "GOVERNANCE" },
    { id: "CLM", label: "CLM", route: "/constitution-violations", group: "GOVERNANCE" },
  ]},
];
