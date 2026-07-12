import { createFileRoute } from "@tanstack/react-router";
import { SUBJECT_RIGHTS } from "@/constants/constitution/subjectRights";

export const Route = createFileRoute("/subject-sovereignty")({
  head: () => ({
    meta: [
      { title: "主体主权 · Subject Sovereignty · Aetherworld 系统宪法" },
      { name: "description", content: "Full60 / Light20 / Demo 主体数据主权、隔离、可清除、不上传与导出提示。" },
      { property: "og:title", content: "Subject Sovereignty · Aetherworld" },
      { property: "og:description", content: "用户主体数据主权宪法条款" },
    ],
  }),
  component: SubjectSovereigntyPage,
});

function SubjectSovereigntyPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">主体主权 · Subject Sovereignty</h1>
        <p className="text-sm text-muted-foreground">
          用户拥有自己的真实主体数据。Full60 / Light20 默认 USER_PRIVATE，不上传、不混入 Demo，导出必有提示。
        </p>
      </header>
      <ul className="space-y-2">
        {SUBJECT_RIGHTS.map((r) => (
          <li key={r.rightId} className="border rounded-md p-3">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-mono text-muted-foreground">{r.rightId}</span>
              <h3 className="font-medium">{r.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{r.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
