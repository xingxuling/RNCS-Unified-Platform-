// 右上下文栏内容解析器：根据当前 path 推断要显示的上下文卡片。
// 初版为静态卡片描述，不直接读取业务运行时状态，避免破坏现有逻辑。

export interface ContextCard {
  id: string;
  title: string;
  rows: { label: string; value: string; tone?: "default" | "ok" | "warn" | "muted" }[];
}

export interface ContextPanelData {
  domainLabel: string;
  routeLabel: string;
  cards: ContextCard[];
  nextActions: { label: string; to?: string }[];
  collapsedByDefault?: boolean;
}

import { findDomainByPath } from "@/config/aetherNavigationDomains";

export function resolveContextPanel(path: string): ContextPanelData {
  const domain = findDomainByPath(path);
  const domainLabel = domain?.label ?? "—";
  const routeLabel = path;

  // Chat
  if (path === "/chat" || path.startsWith("/chat/") || path.startsWith("/aether-chat")) {
    return {
      domainLabel, routeLabel,
      cards: [
        {
          id: "model", title: "当前模型",
          rows: [
            { label: "Provider", value: "ollama-local" },
            { label: "Model", value: "qwen3:8b" },
            { label: "回落", value: "规则模式可用", tone: "muted" },
          ],
        },
        {
          id: "calculus", title: "计算法路由",
          rows: [
            { label: "命中", value: "动态解析（输入时显示）", tone: "muted" },
            { label: "Prompt 模式", value: "LIGHT_ANSWER（默认）", tone: "muted" },
          ],
        },
        {
          id: "safety", title: "安全与指纹",
          rows: [
            { label: "Secret Guard", value: "已启用", tone: "ok" },
            { label: "脱敏", value: "自动", tone: "ok" },
            { label: "数列指纹", value: "回答后生成", tone: "muted" },
          ],
        },
      ],
      nextActions: [
        { label: "查看模型设置", to: "/llm-providers/settings" },
        { label: "测试模型链路", to: "/llm-providers/test" },
      ],
    };
  }

  if (path.startsWith("/workspace") || path.startsWith("/canvas-workspace")) {
    return {
      domainLabel, routeLabel,
      cards: [
        { id: "obj", title: "对象属性", rows: [
          { label: "类型", value: "—", tone: "muted" },
          { label: "版本", value: "—", tone: "muted" },
        ]},
        { id: "qa", title: "QA 状态", rows: [
          { label: "状态", value: "未检查", tone: "muted" },
        ]},
      ],
      nextActions: [{ label: "运行 QA", to: "/system-audit" }],
    };
  }

  if (path.startsWith("/store") || path.startsWith("/webxxm")) {
    return {
      domainLabel, routeLabel,
      cards: [
        { id: "install", title: "安装状态", rows: [
          { label: "已安装能力", value: "查看列表", tone: "muted" },
        ]},
        { id: "perm", title: "权限与依赖", rows: [
          { label: "权限", value: "按需提示", tone: "muted" },
          { label: "依赖", value: "自动解析", tone: "muted" },
        ]},
      ],
      nextActions: [{ label: "已安装", to: "/store/installed" }],
    };
  }

  if (path.startsWith("/calendar") || path.startsWith("/trigger-calendar")) {
    return {
      domainLabel, routeLabel,
      cards: [
        { id: "today", title: "今日触发", rows: [
          { label: "触发器", value: "查看列表", tone: "muted" },
        ]},
        { id: "upcoming", title: "即将到期", rows: [
          { label: "任务", value: "—", tone: "muted" },
        ]},
      ],
      nextActions: [{ label: "查看触发器", to: "/calendar/triggers" }],
    };
  }

  if (path.startsWith("/social")) {
    return {
      domainLabel, routeLabel,
      cards: [
        { id: "vis", title: "可见性", rows: [
          { label: "默认", value: "PRIVATE 草稿", tone: "muted" },
        ]},
        { id: "audit", title: "发布审计", rows: [
          { label: "安全检查", value: "自动", tone: "ok" },
        ]},
      ],
      nextActions: [{ label: "社交审计", to: "/social/audit" }],
    };
  }

  if (path.startsWith("/code-sandbox") || path.startsWith("/code-runs") || path.startsWith("/code-generator")) {
    return {
      domainLabel, routeLabel,
      cards: [
        { id: "run", title: "运行状态", rows: [
          { label: "状态", value: "未运行", tone: "muted" },
        ]},
        { id: "qa", title: "代码 QA", rows: [
          { label: "静态检查", value: "可用", tone: "ok" },
        ]},
      ],
      nextActions: [{ label: "运行记录", to: "/code-runs" }],
    };
  }

  if (path.startsWith("/llm-providers") || path.startsWith("/real-webllm") || path.startsWith("/webllm")) {
    return {
      domainLabel, routeLabel,
      cards: [
        { id: "gw", title: "本地网关", rows: [
          { label: "端口", value: "18777", tone: "muted" },
          { label: "Ollama", value: "11434 / 11435 自动发现", tone: "muted" },
        ]},
        { id: "prov", title: "已知 Provider", rows: [
          { label: "本机 Ollama", value: "ollama-local" },
          { label: "WebLLM", value: "浏览器内模型" },
        ]},
      ],
      nextActions: [{ label: "测试链路", to: "/llm-providers/test" }],
    };
  }

  // 默认
  return {
    domainLabel, routeLabel,
    cards: [
      { id: "ctx", title: "上下文", rows: [
        { label: "当前域", value: domainLabel },
        { label: "路径", value: routeLabel, tone: "muted" },
      ]},
    ],
    nextActions: [{ label: "完整导航", to: "/command-canvas" }],
    collapsedByDefault: true,
  };
}
