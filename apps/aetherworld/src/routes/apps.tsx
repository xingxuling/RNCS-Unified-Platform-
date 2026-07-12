import { createFileRoute } from "@tanstack/react-router";
import { HubPage } from "@/components/minimal/HubPage";

export const Route = createFileRoute("/apps")({
  head: () => ({ meta: [{ title: "应用 · Aetherworld" }] }),
  component: () => (
    <HubPage
      caption="Applications"
      title="应用"
      subtitle="App Runtime、代码沙盒、Patch/Diff 与导出。"
      groups={[
        { id: "runtime", label: "运行时", items: [
          { to: "/app-runtime",    label: "App Runtime" },
          { to: "/app-preview",    label: "App Preview" },
          { to: "/app-projects",   label: "App Projects" },
        ]},
        { id: "code", label: "代码", items: [
          { to: "/code-sandbox",   label: "Code Sandbox" },
          { to: "/code-runs",      label: "Code Runs" },
          { to: "/code-generator", label: "Code Generator" },
        ]},
        { id: "export", label: "导出 / 交接", items: [
          { to: "/engine-export",       label: "引擎导出" },
          { to: "/presentation-export", label: "演示导出" },
          { to: "/multi-world-export",  label: "多世界导出" },
        ]},
      ]}
    />
  ),
});
