import { createFileRoute } from "@tanstack/react-router";
import { CodeSandboxPanel } from "@/components/code-sandbox/CodeSandboxPanel";

export const Route = createFileRoute("/code-sandbox")({
  head: () => ({
    meta: [
      { title: "Code Sandbox · 代码沙箱" },
      { name: "description", content: "Aether Code Sandbox Bridge v0.2 — 把 App Runtime 草案送入受控运行、模拟构建、错误检测、修复建议、Patch 草案与外部修复包链路。" },
    ],
  }),
  component: () => (
    <div className="max-w-7xl mx-auto p-6 space-y-4">
      <header className="space-y-1">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Aether Code Sandbox Bridge · v0.2</div>
        <h1 className="font-display text-2xl gold-text">代码沙箱</h1>
        <p className="text-sm text-muted-foreground">把 App Runtime 生成的代码草案送入受控的运行、模拟构建、错误检测、修复建议、Patch 草案和 QA 复检链路。</p>
      </header>
      <CodeSandboxPanel />
    </div>
  ),
});
