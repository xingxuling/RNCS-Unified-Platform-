import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { MultiWorldExportPanel } from "@/components/sequence-world/multiverse/MultiWorldExportPanel";
import { runMultiWorldNetwork } from "@/lib/sequence-world/multiverse/multiWorldNetworkEngine";

export const Route = createFileRoute("/multi-world-export")({
  head: () => ({
    meta: [
      { title: "多世界导出 · Multi-World Export" },
      { name: "description", content: "导出 Godot / Unity / Three.js / 叙事多宇宙圣经等多世界 Runtime 包。" },
    ],
  }),
  component: () => {
    const r = useMemo(() => runMultiWorldNetwork({ subjectMode: "DEMO" }), []);
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <h1 className="font-display text-2xl gold-text mb-1">多世界导出 · Multi-World Export</h1>
        <p className="text-xs text-muted-foreground mb-4">所有导出包含 metadata + safety 提示。Full60 / Founder 世界默认不进入公共导出。</p>
        <MultiWorldExportPanel result={r} subjectMode="DEMO" />
      </div>
    );
  },
});
