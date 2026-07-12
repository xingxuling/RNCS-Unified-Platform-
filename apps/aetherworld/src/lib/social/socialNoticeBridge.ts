import { toast } from "sonner";
import type { PublishResult } from "./socialPublishEngine";

export function notifyPublishResult(result: PublishResult) {
  if (result.ok && result.post) {
    if (result.post.visibility === "PRIVATE") {
      toast.success("已保存为私密草稿", {
        description: `《${result.post.title}》仅自己可见。`,
      });
    } else {
      toast.success("发布成功", {
        description: `《${result.post.title}》可见性：${result.post.visibility}。${result.backendMode === "LOCAL_MOCK" ? "（本地内测，未同步云端）" : ""}`,
      });
    }
    if (result.warnings && result.warnings.length > 0) {
      toast.warning("内容已脱敏 / 警告", { description: result.warnings.slice(0, 2).join("；") });
    }
    return;
  }
  toast.error("发布已阻断", {
    description: result.reason || result.blockedReasons?.[0] || "系统检测到敏感内容或权限风险。已保存为私密草稿。",
  });
}

export function notifyDemoCannotPublish() {
  toast.warning("当前为 Demo / 本地模式", { description: "无法真正公开发布，可保存为私密草稿。" });
}

export function notifyBackendUnavailable() {
  toast.warning("社交后端暂不可用", { description: "已保存为本地草稿。" });
}

export function notifyContentRedacted(fields: string[]) {
  toast.warning("内容已脱敏", { description: `已移除：${fields.slice(0, 3).join("、")}` });
}

export function notifyPermissionDenied(message = "权限不足") {
  toast.error(message);
}

export function notifyCollected(collected: boolean) {
  toast.success(collected ? "已收藏" : "已取消收藏");
}

export function notifyReacted(active: boolean, label: string) {
  toast.success(active ? `已${label}` : `已取消${label}`);
}
