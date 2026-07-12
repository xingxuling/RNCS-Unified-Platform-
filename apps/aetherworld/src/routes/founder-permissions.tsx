import { createFileRoute } from "@tanstack/react-router";
import { FounderGate } from "@/components/FounderGate";
import { FounderPermissionMatrix } from "@/components/FounderPermissionMatrix";

export const Route = createFileRoute("/founder-permissions")({
  head: () => ({
    meta: [
      { title: "创始人权限矩阵 · Founder Permissions" },
      { name: "description", content: "查看与管理创始人权限矩阵。" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: FounderPermissionsRoute,
});

function FounderPermissionsRoute() {
  return (
    <FounderGate>
      <div className="container mx-auto px-4 py-8 space-y-4">
        <div>
          <h1 className="font-display text-3xl gold-text">创始人权限矩阵</h1>
          <p className="text-sm text-muted-foreground">
            根据角色等级与模块风险等级，决定可见 / 可编辑 / 可执行 / 是否需二次确认。
          </p>
        </div>
        <FounderPermissionMatrix />
      </div>
    </FounderGate>
  );
}
