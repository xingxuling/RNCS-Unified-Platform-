import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { loadProfile, generateProfile, saveProfile, resetProfile } from "@/lib/personalAppProfileEngine";
import { PersonalAppProfileCard } from "@/components/PersonalAppProfileCard";
import { PersonalizedAppPreview } from "@/components/PersonalizedAppPreview";
import { EvolutionSafetyNotice } from "@/components/EvolutionSafetyNotice";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Download, Upload, RefreshCw, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/personal-app-profile")({
  head: () => ({
    meta: [
      { title: "个人 App 配置 · Personal App Profile" },
      { name: "description", content: "查看、导出、导入与重置你的个人 App 配置。" },
    ],
  }),
  component: PersonalAppProfileRoute,
});

function PersonalAppProfileRoute() {
  const [profile, setProfile] = useState(() => loadProfile());
  const [gen, setGen] = useState(() => generateProfile());
  const [importText, setImportText] = useState("");
  const [showImport, setShowImport] = useState(false);

  const refresh = useCallback(() => {
    setProfile(loadProfile()); setGen(generateProfile());
  }, []);

  const handleRegenerate = () => { const g = generateProfile(); saveProfile(g.profile); toast.success("已重新生成 Profile"); refresh(); };
  const handleReset = () => { if (!confirm("恢复默认 Profile？")) return; resetProfile(); toast.success("已恢复默认"); refresh(); };
  const handleExport = () => {
    const data = JSON.stringify(profile, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `personal-app-profile-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url); toast.success("已导出");
  };
  const handleImport = () => {
    try { const p = JSON.parse(importText); saveProfile({ ...profile, ...p }); toast.success("已导入"); refresh(); setShowImport(false); setImportText(""); }
    catch { toast.error("JSON 格式错误"); }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-5">
      <header className="space-y-1">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Personal App Profile</div>
        <h1 className="font-display text-3xl gold-text">个人 App 配置</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          根据本地进化记忆生成的个人 App 形态。你可以导出 / 导入 / 重置，所有数据仅存在本地。
        </p>
        <Link to="/bio-evolution" className="text-xs text-primary hover:underline">← 返回 Bio Evolution</Link>
      </header>

      <div className="flex flex-wrap gap-2">
        <Button onClick={handleRegenerate}><RefreshCw className="w-3.5 h-3.5 mr-1" />重新生成</Button>
        <Button variant="outline" onClick={handleExport}><Download className="w-3.5 h-3.5 mr-1" />导出</Button>
        <Button variant="outline" onClick={() => setShowImport(s => !s)}><Upload className="w-3.5 h-3.5 mr-1" />导入</Button>
        <Button variant="ghost" onClick={handleReset}><RotateCcw className="w-3.5 h-3.5 mr-1" />恢复默认</Button>
      </div>

      {showImport && (
        <div className="aether-card p-4 space-y-2">
          <Textarea rows={6} placeholder="粘贴 Profile JSON" value={importText} onChange={e => setImportText(e.target.value)} />
          <Button size="sm" onClick={handleImport}>确认导入</Button>
        </div>
      )}

      <PersonalAppProfileCard profile={profile} rationale={gen.rationale} />
      <PersonalizedAppPreview profile={profile} />
      <EvolutionSafetyNotice compact />
    </div>
  );
}
