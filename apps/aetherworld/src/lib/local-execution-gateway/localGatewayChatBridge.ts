// Aether Local Execution Gateway · Chat 桥
import { LOCAL_GATEWAY_DEFAULT_URL } from "./localGatewayTypes";
import { LOCAL_GATEWAY_ALLOWED, LOCAL_GATEWAY_FORBIDDEN, LOCAL_GATEWAY_WHITELIST } from "./localGatewaySafetyPolicy";

export type LocalGatewayChatFocus =
  | "OVERVIEW" | "STATUS" | "ENV" | "START_GUIDE" | "LOGS" | "STOP" | "SAFETY";

const FOCUS_LABEL: Record<LocalGatewayChatFocus, string> = {
  OVERVIEW: "本地执行网关总览",
  STATUS: "网关连接状态",
  ENV: "本机训练环境检查",
  START_GUIDE: "本地网关启动方法",
  LOGS: "最近训练日志",
  STOP: "停止当前训练任务",
  SAFETY: "本地网关安全边界",
};

const TRIGGERS = [
  "本地网关", "本地执行网关", "local gateway",
  "本地训练环境", "为什么自动训练不能跑", "网关连上",
  "训练日志", "停止训练", "本地网关安全", "网关启动",
];

export function detectLocalGatewayIntent(raw: string): boolean {
  if (!raw) return false;
  const t = raw.toLowerCase();
  return TRIGGERS.some((k) => t.includes(k.toLowerCase()));
}

function pickFocus(raw: string): LocalGatewayChatFocus {
  const t = raw.toLowerCase();
  if (/安全|边界|forbidden|禁止/.test(t)) return "SAFETY";
  if (/停止|cancel|取消/.test(t)) return "STOP";
  if (/日志|logs/.test(t)) return "LOGS";
  if (/启动|怎么开|run/.test(t)) return "START_GUIDE";
  if (/环境|env|python|依赖/.test(t)) return "ENV";
  if (/连上|连接|status|状态/.test(t)) return "STATUS";
  return "OVERVIEW";
}

export interface ChatLocalGatewayInfo {
  question: string;
  focus: LocalGatewayChatFocus;
  focusLabel: string;
  summary: string;
  defaultUrl: string;
  startCommand: string;
  allowed: string[];
  forbidden: string[];
  whitelist: string[];
  workbenchHint: string;
}

function summarize(focus: LocalGatewayChatFocus): string {
  switch (focus) {
    case "STATUS": return "本地网关默认监听 127.0.0.1:18771，仅本机访问。可在 /system/local-gateway 点击「健康检查」确认连通。";
    case "ENV": return "环境检查会探测 node / python / python3、aether-training / outputs / logs 目录是否可写。";
    case "START_GUIDE": return "在仓库 local-gateway 目录运行 `npm install && npm run local-gateway`，监听 127.0.0.1:18771。";
    case "LOGS": return "训练日志通过 /training/logs/:runId 返回，自动脱敏 api_key / token / password / secret 等字段。";
    case "STOP": return "POST /training/cancel/:runId 可停止当前网关创建的训练进程（仅本网关创建的进程）。";
    case "SAFETY": return "本地执行网关只允许白名单训练命令；spawn shell:false；只在允许目录内运行；不上传数据；不下载模型。";
    case "OVERVIEW":
    default: return "本地执行网关连接 Aetherworld 与本机训练环境，只接收自动训练器生成的训练任务，并在 dry-run + 用户确认后受控执行。";
  }
}

export function buildChatLocalGatewayInfo(raw: string): ChatLocalGatewayInfo | undefined {
  if (!detectLocalGatewayIntent(raw)) return undefined;
  const focus = pickFocus(raw);
  return {
    question: raw,
    focus,
    focusLabel: FOCUS_LABEL[focus],
    summary: summarize(focus),
    defaultUrl: LOCAL_GATEWAY_DEFAULT_URL,
    startCommand: "cd local-gateway && npm install && npm run local-gateway",
    allowed: [...LOCAL_GATEWAY_ALLOWED],
    forbidden: [...LOCAL_GATEWAY_FORBIDDEN],
    whitelist: [...LOCAL_GATEWAY_WHITELIST],
    workbenchHint: "前往 /system/local-gateway 查看连接状态、运行环境检查、执行 dry-run 与启动训练。",
  };
}
