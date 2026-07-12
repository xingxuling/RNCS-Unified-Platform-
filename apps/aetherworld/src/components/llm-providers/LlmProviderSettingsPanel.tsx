import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  loadProviders,
  upsertProvider,
  getDefaultProviderId,
  setDefaultProviderId,
} from "@/lib/llm-providers/llmProviderSettings";
import { checkProvider, type ProviderHealth } from "@/lib/llm-providers/llmProviderHealthCheck";
import type { LlmProviderConfig } from "@/lib/llm-providers/llmProviderTypes";
import { isLocalBaseUrl } from "@/lib/llm-providers/llmProviderSafetyGuard";
import { OllamaDiagnosticCard } from "./OllamaDiagnosticCard";
import { diagnoseOllama, type OllamaDiagnosticReport } from "@/lib/llm-providers/ollamaDiagnostics";
import { discoverOllama, type OllamaDiscoveryResult } from "@/lib/llm-providers/ollamaDiscovery";
import { LocalGatewayCard } from "./LocalGatewayCard";

const STATUS_LABEL: Record<string, string> = {
  READY: "就绪",
  UNREACHABLE: "无法连接",
  NO_MODEL: "无可用模型",
  AUTH_REQUIRED: "需要密钥",
  ERROR: "异常",
  UNSAFE_REMOTE: "远程风险",
  UNKNOWN: "未知",
};

export function LlmProviderSettingsPanel() {
  const [providers, setProviders] = useState<LlmProviderConfig[]>([]);
  const [defaultId, setDefaultId] = useState<string>("AUTO");
  const [health, setHealth] = useState<Record<string, ProviderHealth>>({});
  const [checking, setChecking] = useState<string | null>(null);
  const [ollamaReports, setOllamaReports] = useState<Record<string, OllamaDiagnosticReport>>({});
  const [discoveries, setDiscoveries] = useState<Record<string, OllamaDiscoveryResult>>({});
  const [discovering, setDiscovering] = useState<string | null>(null);

  useEffect(() => {
    setProviders(loadProviders());
    setDefaultId(getDefaultProviderId());
  }, []);

  const handleField = (id: string, field: keyof LlmProviderConfig, value: string | boolean) => {
    setProviders((prev) =>
      prev.map((p) => (p.providerId === id ? ({ ...p, [field]: value } as LlmProviderConfig) : p))
    );
  };

  const handleSave = (p: LlmProviderConfig) => {
    upsertProvider(p);
    toast.success(`已保存：${p.chineseName}`);
  };

  const handleCheck = async (p: LlmProviderConfig) => {
    setChecking(p.providerId);
    const r = await checkProvider(p);
    setHealth((h) => ({ ...h, [p.providerId]: r }));
    setChecking(null);
    if (r.status === "READY") {
      toast.success(`${p.chineseName} 已连接。`);
      setOllamaReports((m) => {
        const next = { ...m };
        delete next[p.providerId];
        return next;
      });
    } else if (p.providerType === "OLLAMA") {
      toast.warning("无法连接 Ollama，已保持降级模式。");
      const rep = await diagnoseOllama(p);
      setOllamaReports((m) => ({ ...m, [p.providerId]: rep }));
    } else {
      toast.error(`${p.chineseName}：${STATUS_LABEL[r.status]}`);
    }
  };

  const handleDiscoverOllama = async (p: LlmProviderConfig) => {
    setDiscovering(p.providerId);
    try {
      const result = await discoverOllama(p.baseUrl);
      setDiscoveries((m) => ({ ...m, [p.providerId]: result }));
      if (result.found && result.baseUrl) {
        const nextDefault =
          result.models.includes(p.defaultModel || "") ? p.defaultModel : result.models[0] || "";
        const updated: LlmProviderConfig = {
          ...p,
          baseUrl: result.baseUrl,
          defaultModel: nextDefault || p.defaultModel,
        };
        setProviders((prev) =>
          prev.map((x) => (x.providerId === p.providerId ? updated : x)),
        );
        upsertProvider(updated);
        if (result.switchedFromDefault) {
          toast.success(result.message);
        } else {
          toast.success("Ollama 已连接。");
        }
        if (
          p.defaultModel &&
          !result.models.includes(p.defaultModel) &&
          result.models.length > 0
        ) {
          toast.warning("当前默认模型不存在，请从已安装模型中选择。");
        }
        // 刷新健康检查与清除诊断卡
        const h = await checkProvider(updated);
        setHealth((hs) => ({ ...hs, [p.providerId]: h }));
        setOllamaReports((m) => {
          const next = { ...m };
          delete next[p.providerId];
          return next;
        });
      } else {
        toast.error(result.message);
      }
    } finally {
      setDiscovering(null);
    }
  };

  const handleSetDefault = (id: string) => {
    setDefaultProviderId(id);
    setDefaultId(id);
    toast.success("默认模型提供者已切换。");
  };

  return (
    <div className="space-y-4">
      <LocalGatewayCard />
      <Card className="p-4 bg-muted/30">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="text-sm font-medium">默认模型提供者</div>
            <div className="text-xs text-muted-foreground mt-1">
              选择 Aetherworld 调用语言模型的默认来源；选「自动」会按优先级依次尝试。
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant={defaultId === "AUTO" ? "default" : "outline"}
              onClick={() => handleSetDefault("AUTO")}
            >
              自动
            </Button>
            {providers.map((p) => (
              <Button
                key={p.providerId}
                size="sm"
                variant={defaultId === p.providerId ? "default" : "outline"}
                onClick={() => handleSetDefault(p.providerId)}
              >
                {p.chineseName}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {providers.map((p) => {
        const h = health[p.providerId];
        const remote = !isLocalBaseUrl(p.baseUrl);
        const discovery = discoveries[p.providerId];
        const installedModels = discovery?.found ? discovery.models : [];
        const defaultModelMissing =
          !!p.defaultModel && installedModels.length > 0 && !installedModels.includes(p.defaultModel);
        return (
          <Card key={p.providerId} className="p-4 space-y-3">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <div className="font-medium flex items-center gap-2">
                  {p.chineseName}
                  <Badge variant="outline" className="text-[10px]">{p.displayName}</Badge>
                  {remote ? (
                    <Badge variant="destructive" className="text-[10px]">远程</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">本地</Badge>
                  )}
                  {h && (
                    <Badge
                      className="text-[10px]"
                      variant={h.status === "READY" ? "default" : "destructive"}
                    >
                      {STATUS_LABEL[h.status]}
                      {h.latencyMs ? ` · ${h.latencyMs}ms` : ""}
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  类型：{p.providerType}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {p.providerType === "OLLAMA" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDiscoverOllama(p)}
                    disabled={discovering === p.providerId}
                  >
                    {discovering === p.providerId ? "检测中…" : "自动检测 Ollama"}
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => handleCheck(p)} disabled={checking === p.providerId}>
                  {checking === p.providerId ? "检测中…" : "连接检测"}
                </Button>
                <Button size="sm" onClick={() => handleSave(p)}>保存</Button>
              </div>
            </div>

            {p.providerType !== "WEBLLM" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">接口地址 Base URL</Label>
                  <Input
                    value={p.baseUrl || ""}
                    placeholder="http://localhost:11434"
                    onChange={(e) => handleField(p.providerId, "baseUrl", e.target.value)}
                  />
                  {p.providerType === "OLLAMA" && (
                    <div className="text-[11px] text-muted-foreground mt-1">
                      支持自定义端口；点击「自动检测 Ollama」可在 11434 / 11435 等常见端口中自动发现。
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-xs">默认模型 Model</Label>
                  {p.providerType === "OLLAMA" && installedModels.length > 0 ? (
                    <div className="space-y-1">
                      <Select
                        value={
                          installedModels.includes(p.defaultModel || "")
                            ? p.defaultModel || ""
                            : ""
                        }
                        onValueChange={(v) => handleField(p.providerId, "defaultModel", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="从已安装模型中选择" />
                        </SelectTrigger>
                        <SelectContent>
                          {installedModels.map((m) => (
                            <SelectItem key={m} value={m}>
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {defaultModelMissing && (
                        <div className="text-[11px] text-amber-600">
                          当前默认模型「{p.defaultModel}」不存在，请从已安装模型中选择。
                        </div>
                      )}
                    </div>
                  ) : (
                    <Input
                      value={p.defaultModel || ""}
                      placeholder="qwen2.5:8b"
                      onChange={(e) => handleField(p.providerId, "defaultModel", e.target.value)}
                    />
                  )}
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs">密钥 API Key（可选；不保存到云端对象）</Label>
                  <Input
                    type="password"
                    value={p.apiKey || ""}
                    onChange={(e) => handleField(p.providerId, "apiKey", e.target.value)}
                  />
                </div>
              </div>
            )}

            {remote && (
              <div className="text-xs text-amber-500 bg-amber-500/10 border border-amber-500/30 rounded p-2">
                你正在连接远程模型服务，请确认你信任该地址。Aetherworld 不会发送 Founder-only、Full60 原始数列、密钥或密码。
              </div>
            )}

            {p.providerType === "OLLAMA" && discovery && (
              <div className="text-xs rounded border bg-background/60 p-2 space-y-2">
                <div className="font-medium">
                  自动检测结果：
                  <span className={discovery.found ? "text-emerald-600 ml-1" : "text-destructive ml-1"}>
                    {discovery.message}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {discovery.probes.map((pr) => (
                    <div key={pr.baseUrl} className="flex items-center justify-between gap-2">
                      <code className="text-[11px] truncate">{pr.baseUrl}</code>
                      {pr.ok ? (
                        <Badge variant="default" className="text-[10px]">READY · {pr.models.length} 模型</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">
                          {pr.error || "失败"}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
                {discovery.found && installedModels.length > 0 && (
                  <div>
                    <div className="text-[11px] text-muted-foreground mb-1">已安装模型</div>
                    <div className="flex flex-wrap gap-1">
                      {installedModels.map((m) => (
                        <Badge
                          key={m}
                          variant={m === p.defaultModel ? "default" : "outline"}
                          className="text-[10px] cursor-pointer"
                          onClick={() => handleField(p.providerId, "defaultModel", m)}
                        >
                          {m}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {discovery.found && discovery.baseUrl && (
                  <div className="text-[11px] text-muted-foreground">
                    Windows PowerShell 测试命令：
                    <code className="ml-1 px-1.5 py-0.5 rounded bg-muted">
                      curl.exe {discovery.baseUrl}/api/tags
                    </code>
                  </div>
                )}
              </div>
            )}

            {p.providerType === "OLLAMA" && !discovery && (
              <div className="text-xs text-muted-foreground">
                建议使用 8B 以上开源模型。可在终端执行：
                <code className="ml-1 px-1.5 py-0.5 rounded bg-muted">ollama pull qwen2.5:8b</code>
              </div>
            )}

            {p.providerType === "OLLAMA" && h && h.status !== "READY" && (
              <OllamaDiagnosticCard
                provider={p}
                initialReport={ollamaReports[p.providerId]}
              />
            )}
          </Card>
        );
      })}
    </div>
  );
}
