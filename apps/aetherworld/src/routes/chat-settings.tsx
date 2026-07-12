import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const KEY = "aether.chat.settings.v1";

interface ChatSettings {
  defaultMode: "AUTO" | "ANSWER_ONLY" | "CREATE_OBJECT" | "RUN_CAPABILITY" | "OPEN_PAGE" | "QA_CHECK" | "FOUNDER";
  defaultWorkspaceId?: string;
  autoSaveObject: boolean;
  autoOpenResult: boolean;
  autoPromptInstall: boolean;
  allowInChatDownload: boolean;
  founderVisible: boolean;
}

const DEFAULT: ChatSettings = {
  defaultMode: "AUTO",
  autoSaveObject: true,
  autoOpenResult: false,
  autoPromptInstall: true,
  allowInChatDownload: false,
  founderVisible: false,
};

function load(): ChatSettings {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT;
}

function save(s: ChatSettings) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
}

export const Route = createFileRoute("/chat-settings")({
  head: () => ({ meta: [{ title: "对话设置 · Aetherworld" }] }),
  component: ChatSettingsPage,
});

function ChatSettingsPage() {
  const [s, setS] = useState<ChatSettings>(DEFAULT);
  useEffect(() => { setS(load()); }, []);
  const update = (patch: Partial<ChatSettings>) => {
    const next = { ...s, ...patch };
    setS(next); save(next);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
        <header className="space-y-1">
          <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Chat Settings</div>
          <h1 className="text-2xl font-display">对话设置</h1>
          <p className="text-sm text-muted-foreground">配置默认行为，受 System Constitution 与 QA 约束。</p>
        </header>

        <section className="aether-card p-4 space-y-4">
          <Row label="默认运行模式">
            <select
              value={s.defaultMode}
              onChange={(e) => update({ defaultMode: e.target.value as ChatSettings["defaultMode"] })}
              className="bg-background border border-border/60 rounded-md px-2 py-1 text-sm"
            >
              <option value="AUTO">自动</option>
              <option value="ANSWER_ONLY">只回答</option>
              <option value="CREATE_OBJECT">创建对象</option>
              <option value="RUN_CAPABILITY">调用能力</option>
              <option value="OPEN_PAGE">打开页面</option>
              <option value="QA_CHECK">QA 检查</option>
              <option value="FOUNDER">Founder Mode</option>
            </select>
          </Row>
          <Row label="默认 Workspace ID">
            <input
              type="text"
              value={s.defaultWorkspaceId ?? ""}
              onChange={(e) => update({ defaultWorkspaceId: e.target.value || undefined })}
              placeholder="留空使用当前"
              className="bg-background border border-border/60 rounded-md px-2 py-1 text-sm w-48"
            />
          </Row>
          <Toggle label="自动保存对象到 Workspace" value={s.autoSaveObject} onChange={(v) => update({ autoSaveObject: v })} />
          <Toggle label="自动打开结果页面" value={s.autoOpenResult} onChange={(v) => update({ autoOpenResult: v })} />
          <Toggle label="未安装 WebXXM 时自动提示安装" value={s.autoPromptInstall} onChange={(v) => update({ autoPromptInstall: v })} />
          <Toggle label="允许对话内直接下载能力模型" value={s.allowInChatDownload} onChange={(v) => update({ allowInChatDownload: v })} />
          <Toggle label="Founder Mode 可见设置" value={s.founderVisible} onChange={(v) => update({ founderVisible: v })} />
        </section>

        <p className="text-[11px] text-muted-foreground">
          注：所有设置仅存储于本地浏览器，不会上传。Chat 仍受 Runtime Spine、QA、System Constitution 与 WebXXM 安装启用机制约束。
        </p>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-sm">{label}</div>
      {children}
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Row label={label}>
      <button
        onClick={() => onChange(!value)}
        className={[
          "w-9 h-5 rounded-full transition-colors relative",
          value ? "bg-foreground" : "bg-muted",
        ].join(" ")}
      >
        <span className={[
          "absolute top-0.5 w-4 h-4 rounded-full bg-background transition-all",
          value ? "left-[18px]" : "left-0.5",
        ].join(" ")} />
      </button>
    </Row>
  );
}
