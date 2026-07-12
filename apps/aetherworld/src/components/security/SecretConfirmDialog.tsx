// 通用「检测到敏感字段」确认弹窗
// 用法：在 Workspace 保存 / Provider 保存 / Handoff 导出 / Social 发布 / Chat 保存等场景调用。
import { useEffect } from "react";

export interface SecretHitLite {
  label: string;
  sample: string;
}

export interface SecretConfirmDialogProps {
  open: boolean;
  hits: SecretHitLite[];
  scene?: string;
  onCancel: () => void;
  onConfirmRedacted: () => void;
}

export function SecretConfirmDialog({ open, hits, scene, onCancel, onConfirmRedacted }: SecretConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-lg border border-border bg-background shadow-xl p-5 space-y-4">
        <div className="space-y-1">
          <h3 className="text-base font-semibold">检测到敏感字段</h3>
          <p className="text-xs text-muted-foreground">
            {scene ? `场景：${scene}。` : ""}
            系统检测到密钥、token 或密码字段。为保护安全，将默认脱敏保存（仅保留前后缀，原文不会写入对象）。
          </p>
        </div>

        {hits.length > 0 ? (
          <ul className="rounded-md border border-border bg-muted/30 px-3 py-2 max-h-40 overflow-auto text-xs space-y-1">
            {hits.slice(0, 12).map((h, i) => (
              <li key={i} className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">{h.label}</span>
                <code className="font-mono text-[11px]">{h.sample}</code>
              </li>
            ))}
            {hits.length > 12 ? <li className="text-muted-foreground">…共 {hits.length} 处</li> : null}
          </ul>
        ) : null}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="h-8 px-3 text-sm rounded-md border border-border hover:bg-muted"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onConfirmRedacted}
            className="h-8 px-3 text-sm rounded-md bg-foreground text-background hover:opacity-90"
          >
            脱敏后保存
          </button>
        </div>
      </div>
    </div>
  );
}
