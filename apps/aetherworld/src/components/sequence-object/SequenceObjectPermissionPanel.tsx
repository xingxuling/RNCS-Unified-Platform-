import type { SequenceObjectPermission } from "@/lib/sequence-object/sequenceObjectPermissionGuard";
import { PERMISSION_LEVEL_LABELS } from "@/constants/sequence-object/sequenceObjectPermissionLevels";

export function SequenceObjectPermissionPanel({ permission }: { permission: SequenceObjectPermission }) {
  return (
    <div className="rounded-md border border-border bg-card/40 p-3 text-sm">
      <div className="mb-2 font-medium">权限 · Permission</div>
      <div className="text-xs">访问级别：{PERMISSION_LEVEL_LABELS[permission.accessLevel]}（{permission.accessLevel}）</div>
      <div className="mt-1 grid grid-cols-3 gap-1 text-xs">
        <div>编辑：{permission.canEdit ? "✓" : "✗"}</div>
        <div>导出：{permission.canExport ? "✓" : "✗"}</div>
        <div>分享：{permission.canShare ? "✓" : "✗"}</div>
        <div>跨域：{permission.canCrossUse ? "✓" : "✗"}</div>
        <div>转运行时：{permission.canBecomeRuntimeObject ? "✓" : "✗"}</div>
        <div>转公开：{permission.canBecomePublic ? "✓" : "✗"}</div>
      </div>
      {permission.permissionNotes.length > 0 && (
        <ul className="mt-2 text-xs text-amber-300 space-y-0.5">
          {permission.permissionNotes.map((n, i) => <li key={i}>· {n}</li>)}
        </ul>
      )}
    </div>
  );
}
