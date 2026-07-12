import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  getGatewayUrl,
  setGatewayUrl,
  DEFAULT_GATEWAY_URL,
  type LocalGatewayStatus,
} from "@/lib/local-gateway/localGatewayStatus";
import {
  getGatewayStatus,
  discoverOllamaViaGateway,
} from "@/lib/local-gateway/aetherLocalGatewayClient";
import {
  LOCAL_GATEWAY_ALLOWED,
  LOCAL_GATEWAY_FORBIDDEN,
} from "@/lib/local-gateway/localGatewaySecurityPolicy";

const GATEWAY_BADGE: Record<string, { label: string; variant: "default" | "destructive" | "outline" | "secondary" }> = {
  GATEWAY_READY: { label: "网关就绪", variant: "default" },
  GATEWAY_OFFLINE: { label: "网关未启动", variant: "destructive" },
  GATEWAY_ERROR: { label: "网关异常", variant: "destructive" },
};

const OLLAMA_BADGE: Record<string, { label: string; variant: "default" | "destructive" | "outline" | "secondary" }> = {
  OLLAMA_READY: { label: "Ollama 就绪", variant: "default" },
  OLLAMA_NOT_FOUND: { label: "未发现 Ollama", variant: "destructive" },
  OLLAMA_PORT_CHANGED: { label: "端口已切换", variant: "secondary" },
  TERMINAL_OK_BROWSER_BLOCKED: { label: "浏览器被拦截", variant: "destructive" },
  MODEL_NOT_FOUND: { label: "模型不存在", variant: "secondary" },
  UNKNOWN: { label: "未知", variant: "outline" },
};

export function LocalGatewayCard() {
  const [url, setUrl] = useState<string>(DEFAULT_GATEWAY_URL);
  const [status, setStatus] = useState<LocalGatewayStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [discovering, setDiscovering] = useState(false);

  useEffect(() => {
    setUrl(getGatewayUrl());
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = async (nextUrl?: string) => {
    setLoading(true);
    try {
      const s = await getGatewayStatus(nextUrl);
      setStatus(s);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUrl = () => {
    setGatewayUrl(url);
    toast.success("本地网关地址已保存。");
    void refresh(url);
  };

  const handleDiscover = async () => {
    setDiscovering(true);
    try {
      const r = await discoverOllamaViaGateway(url);
      if (r.ok) {
        toast.success(r.message);
        await refresh(url);
      } else {
        toast.error(r.message);
      }
    } finally {
      setDiscovering(false);
    }
  };

  const handleCopyStart = async () => {
    const cmd = "cd local-gateway && npm install && npm run dev";
    try {
      await navigator.clipboard.writeText(cmd);
      toast.success("启动命令已复制。");
    } catch {
      toast.error("复制失败，请手动复制：" + cmd);
    }
  };

  const gw = GATEWAY_BADGE[status?.gateway || "GATEWAY_OFFLINE"];
  const ol = OLLAMA_BADGE[status?.ollama || "UNKNOWN"];

  return (
    <Card className="p-4 space-y-3 border-primary/30">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <div className="font-medium flex items-center gap-2">
            Aether Local Gateway
            <Badge variant="outline" className="text-[10px]">本地网关</Badge>
            <Badge variant={gw.variant} className="text-[10px]">{gw.label}</Badge>
            {status && (
              <Badge variant={ol.variant} className="text-[10px]">{ol.label}</Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            前端通过本地网关访问 Ollama / 本地模型，规避浏览器 HTTPS→HTTP 与 CORS 限制。Gateway 不会执行 Shell，也不会读写全盘文件。
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => refresh(url)} disabled={loading}>
            {loading ? "检测中…" : "刷新状态"}
          </Button>
          <Button size="sm" variant="outline" onClick={handleDiscover} disabled={discovering}>
            {discovering ? "自动发现中…" : "自动发现 Ollama"}
          </Button>
          <Button size="sm" variant="outline" onClick={handleCopyStart}>
            复制启动命令
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          <Label className="text-xs">本地网关地址</Label>
          <div className="flex gap-2">
            <Input
              value={url}
              placeholder={DEFAULT_GATEWAY_URL}
              onChange={(e) => setUrl(e.target.value)}
            />
            <Button size="sm" onClick={handleSaveUrl}>保存</Button>
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            默认 {DEFAULT_GATEWAY_URL}；本地网关模板在仓库 <code>/local-gateway</code>。
          </div>
        </div>
        <div>
          <Label className="text-xs">当前转发地址</Label>
          <div className="text-xs px-2 py-2 rounded bg-muted truncate">
            {status?.activeBaseUrl || "—"}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            来源：{status?.activeProvider || "none"}
          </div>
        </div>
      </div>

      {status?.models && status.models.length > 0 && (
        <div>
          <div className="text-[11px] text-muted-foreground mb-1">已安装模型</div>
          <div className="flex flex-wrap gap-1">
            {status.models.map((m) => (
              <Badge key={m} variant="outline" className="text-[10px]">{m}</Badge>
            ))}
          </div>
        </div>
      )}

      {status?.gateway === "GATEWAY_OFFLINE" && (
        <div className="text-xs rounded border border-destructive/30 bg-destructive/5 p-2 space-y-1">
          <div className="font-medium text-destructive">本地网关未启动</div>
          <div>
            请在仓库目录执行：
            <code className="ml-1 px-1.5 py-0.5 rounded bg-muted">cd local-gateway &amp;&amp; npm install &amp;&amp; npm run dev</code>
          </div>
          <div>未启动时，Chat 将回落到 WebLLM 或规则模式以保证主链路可用。</div>
        </div>
      )}

      {status?.gateway === "GATEWAY_READY" && status.ollama === "OLLAMA_READY" && (
        <div className="text-xs rounded border border-emerald-500/30 bg-emerald-500/5 p-2">
          已通过本地网关连接 Ollama。Chat 将优先经由 Gateway 转发，避免浏览器跨域限制。
        </div>
      )}

      <details className="text-[11px] text-muted-foreground">
        <summary className="cursor-pointer">安全边界（本地网关能做与不能做）</summary>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="font-medium text-foreground mb-1">允许</div>
            <ul className="list-disc pl-4 space-y-0.5">
              {LOCAL_GATEWAY_ALLOWED.map((t) => (<li key={t}>{t}</li>))}
            </ul>
          </div>
          <div>
            <div className="font-medium text-foreground mb-1">禁止</div>
            <ul className="list-disc pl-4 space-y-0.5">
              {LOCAL_GATEWAY_FORBIDDEN.map((t) => (<li key={t}>{t}</li>))}
            </ul>
          </div>
        </div>
      </details>
    </Card>
  );
}
