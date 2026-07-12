import { useState } from "react";
import { ShieldAlert, KeyRound, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  setupFounderPassword,
  verifyFounderPassword,
  validatePassphrase,
  isFounderPasswordSet,
  clearSecurityState,
} from "@/lib/founderPasswordCalculus";
import { startSession } from "@/lib/founderSessionManager";
import { appendAuditLog } from "@/lib/founderAuditLog";
import { FOUNDER_MODE_RULES } from "@/constants/founderModeRules";
import { useFounderState } from "@/hooks/useFounderState";

export function FounderLoginPanel() {
  const { refresh } = useFounderState();
  const initialMode: "SETUP" | "LOGIN" = isFounderPasswordSet() ? "LOGIN" : "SETUP";
  const [mode, setMode] = useState<"SETUP" | "LOGIN" | "RESET_CONFIRM">(initialMode);
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [hours, setHours] = useState<number>(FOUNDER_MODE_RULES.DEFAULT_SESSION_HOURS);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSetup = async () => {
    setErr("");
    const v = validatePassphrase(pw);
    if (!v.ok) return setErr(v.message ?? "口令无效");
    if (pw !== confirm) return setErr("两次输入不一致");
    setBusy(true);
    try {
      await setupFounderPassword(pw);
      startSession(hours || FOUNDER_MODE_RULES.DEFAULT_SESSION_HOURS);
      appendAuditLog({
        action: "首次设置创始人口令",
        moduleId: "founder-console",
        riskLevel: "MEDIUM",
        details: "本地 Founder Gate 已启用",
        success: true,
      });
      refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleLogin = async () => {
    setErr("");
    setBusy(true);
    try {
      const ok = await verifyFounderPassword(pw);
      if (!ok) {
        setErr("口令不正确");
        appendAuditLog({
          action: "创始人登录失败",
          moduleId: "founder-console",
          riskLevel: "HIGH",
          details: "口令验证失败",
          success: false,
        });
        return;
      }
      startSession(hours || FOUNDER_MODE_RULES.DEFAULT_SESSION_HOURS);
      appendAuditLog({
        action: "进入创始人模式",
        moduleId: "founder-console",
        riskLevel: "MEDIUM",
        details: `会话时长 ${hours} 小时`,
        success: true,
      });
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const handleReset = () => {
    clearSecurityState();
    appendAuditLog({
      action: "重置本地创始人口令",
      moduleId: "founder-console",
      riskLevel: "CRITICAL",
      details: "本地 Founder Gate 已清除",
      success: true,
    });
    setMode("SETUP");
    setPw("");
    setConfirm("");
    refresh();
  };

  return (
    <Card className="aether-card-elevated p-6 max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h2 className="font-display text-xl">创始人模式 · Founder Gate</h2>
          <p className="text-xs text-muted-foreground">本地保护 · Local Protection Only</p>
        </div>
      </div>

      <Alert className="mb-4 border-amber-500/30 bg-amber-500/5">
        <AlertDescription className="text-xs leading-relaxed">
          {FOUNDER_MODE_RULES.WARNING_LOCAL_ONLY}
        </AlertDescription>
      </Alert>

      {mode === "SETUP" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            创始人模式尚未启用。请设置一个本地创始人口令，仅用于保护当前设备上的高阶功能入口。
          </p>
          <div>
            <Label className="text-xs">设置口令（≥6 字符）</Label>
            <div className="relative">
              <Input type={show ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} />
              <button type="button" className="absolute right-2 top-2 text-muted-foreground" onClick={() => setShow(!show)}>
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <Label className="text-xs">再次输入</Label>
            <Input type={show ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          <SessionDurationPicker value={hours} onChange={setHours} />
          {err && <p className="text-xs text-destructive">{err}</p>}
          <Button onClick={handleSetup} disabled={busy} className="w-full gap-2">
            <KeyRound className="w-4 h-4" /> 启用创始人模式
          </Button>
        </div>
      )}

      {mode === "LOGIN" && (
        <div className="space-y-3">
          <div>
            <Label className="text-xs">创始人口令</Label>
            <div className="relative">
              <Input
                type={show ? "text" : "password"}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
              <button type="button" className="absolute right-2 top-2 text-muted-foreground" onClick={() => setShow(!show)}>
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <SessionDurationPicker value={hours} onChange={setHours} />
          {err && <p className="text-xs text-destructive">{err}</p>}
          <div className="flex gap-2">
            <Button onClick={handleLogin} disabled={busy} className="flex-1 gap-2">
              <KeyRound className="w-4 h-4" /> 登录创始人模式
            </Button>
            <Button variant="outline" onClick={() => setMode("RESET_CONFIRM")}>
              忘记 / 重置
            </Button>
          </div>
        </div>
      )}

      {mode === "RESET_CONFIRM" && (
        <div className="space-y-3">
          <Alert className="border-destructive/40 bg-destructive/5">
            <AlertDescription className="text-xs leading-relaxed">
              重置将清除本地创始人保护设置，但不会删除普通主体数据。重置后需要重新设置口令。是否继续？
            </AlertDescription>
          </Alert>
          <div className="flex gap-2">
            <Button variant="destructive" onClick={handleReset}>确认重置</Button>
            <Button variant="outline" onClick={() => setMode("LOGIN")}>取消</Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function SessionDurationPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <Label className="text-xs">会话时长</Label>
      <div className="grid grid-cols-4 gap-2 mt-1">
        {FOUNDER_MODE_RULES.SESSION_DURATION_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.hours || 0.5)}
            className={`px-2 py-1.5 text-xs rounded border transition ${
              value === (opt.hours || 0.5)
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
