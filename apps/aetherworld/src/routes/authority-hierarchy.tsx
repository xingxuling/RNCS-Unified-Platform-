import { createFileRoute } from "@tanstack/react-router";
import { AUTHORITY_HIERARCHY } from "@/constants/constitution/authorityHierarchy";

export const Route = createFileRoute("/authority-hierarchy")({
  head: () => ({
    meta: [
      { title: "权限层级 · Authority Hierarchy · Aetherworld 系统宪法" },
      { name: "description", content: "Aetherworld 7 级治理权限：宪法 > 系统 > 创始人 > Full60 > 真实主体 > 高级用户 > 普通用户。" },
      { property: "og:title", content: "Authority Hierarchy · Aetherworld" },
      { property: "og:description", content: "宪法治理层级 · 读写导出锁定权限矩阵" },
    ],
  }),
  component: AuthorityHierarchyPage,
});

function AuthorityHierarchyPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">权限层级 · Authority Hierarchy</h1>
        <p className="text-sm text-muted-foreground">
          Aetherworld 系统宪法 v0.2 定义的 7 级治理权限：宪法（最高） &gt; 系统 &gt; 创始人 &gt; Full60 用户 &gt; 真实主体用户 &gt; 高级用户 &gt; 普通用户。
        </p>
      </header>

      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="p-2">层级</th>
              <th className="p-2">Actor</th>
              <th className="p-2">说明</th>
              <th className="p-2">可读</th>
              <th className="p-2">可写</th>
              <th className="p-2">可锁定</th>
            </tr>
          </thead>
          <tbody>
            {AUTHORITY_HIERARCHY.map((r, idx) => (
              <tr key={r.actor} className="border-t align-top">
                <td className="p-2 font-mono">{idx + 1}</td>
                <td className="p-2 font-medium">{r.actor}</td>
                <td className="p-2 text-muted-foreground">{r.chineseName}</td>
                <td className="p-2 text-xs">{r.canRead.join(", ") || "—"}</td>
                <td className="p-2 text-xs">{r.canWrite.join(", ") || "—"}</td>
                <td className="p-2 text-xs">{r.canLock.join(", ") || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        说明：本层级为系统治理内部权限模型，不代表现实法律权限。Founder Locked 条款即使 Founder 也不得绕过其安全/隐私/货币边界。
      </p>
    </div>
  );
}
