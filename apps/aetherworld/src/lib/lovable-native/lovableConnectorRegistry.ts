/**
 * Lovable Connector Registry
 *
 * 在 Aetherworld 内提供「Lovable 可对接的 App Connector」的目录视图，
 * 用于在 /integrations/lovable 页面展示。实际连接由 Lovable 的连接器系统完成。
 */
export interface LovableConnectorEntry {
  connectorId: string;
  chineseName: string;
  enLabel: string;
  fitFor: string[];
  /** 是否使用 Lovable 的统一 Gateway（无需用户配置 API key） */
  usesGateway: boolean;
}

export const LOVABLE_CONNECTORS: LovableConnectorEntry[] = [
  { connectorId: "google_mail",      chineseName: "Gmail",                enLabel: "Gmail",            fitFor: ["提醒", "通知"],            usesGateway: true },
  { connectorId: "google_calendar",  chineseName: "Google 日历",           enLabel: "Google Calendar",  fitFor: ["触发日历"],                usesGateway: true },
  { connectorId: "google_sheets",    chineseName: "Google 表格",           enLabel: "Google Sheets",    fitFor: ["对象", "现实数据"],        usesGateway: true },
  { connectorId: "slack",            chineseName: "Slack",                enLabel: "Slack",            fitFor: ["提醒", "团队协作"],        usesGateway: true },
  { connectorId: "notion",           chineseName: "Notion",               enLabel: "Notion",           fitFor: ["知识库", "创作"],          usesGateway: true },
  { connectorId: "resend",           chineseName: "Resend 邮件",           enLabel: "Resend",           fitFor: ["鉴权", "提醒"],            usesGateway: true },
  { connectorId: "elevenlabs",       chineseName: "ElevenLabs 语音",       enLabel: "ElevenLabs",       fitFor: ["WebVoiceM"],               usesGateway: false },
  { connectorId: "firecrawl",        chineseName: "Firecrawl 抓取",        enLabel: "Firecrawl",        fitFor: ["WebKnowledgeM", "研究"],   usesGateway: false },
  { connectorId: "perplexity",       chineseName: "Perplexity 搜索",       enLabel: "Perplexity",       fitFor: ["WebResearchM"],            usesGateway: false },
  { connectorId: "google_maps",      chineseName: "Google 地图",           enLabel: "Google Maps",      fitFor: ["世界", "现实数据"],        usesGateway: true },
  { connectorId: "twilio",           chineseName: "Twilio 通讯",           enLabel: "Twilio",           fitFor: ["提醒", "鉴权"],            usesGateway: true },
  { connectorId: "gemini_enterprise",chineseName: "Gemini 企业搜索",       enLabel: "Gemini Enterprise",fitFor: ["WebKnowledgeM"],           usesGateway: true },
];
