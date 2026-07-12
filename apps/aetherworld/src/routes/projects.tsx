import { createFileRoute } from "@tanstack/react-router";
import { HubPage } from "@/components/minimal/HubPage";

export const Route = createFileRoute("/projects")({
  head: () => ({ meta: [{ title: "项目 · Aetherworld" }] }),
  component: () => (
    <HubPage
      caption="Projects"
      title="项目"
      subtitle="App 项目、代码运行项目、世界项目与能力运行项目。"
      groups={[
        { id: "main", label: "项目入口", items: [
          { to: "/app-projects",        label: "App Projects" },
          { to: "/app-project-entry",   label: "新建 App 项目" },
          { to: "/code-runs",           label: "Code Runs" },
          { to: "/code-run-entry",      label: "新建 Code Run" },
          { to: "/web-capability-run",  label: "能力运行" },
          { to: "/web-capability-entry",label: "新建能力任务" },
        ]},
      ]}
    />
  ),
});
