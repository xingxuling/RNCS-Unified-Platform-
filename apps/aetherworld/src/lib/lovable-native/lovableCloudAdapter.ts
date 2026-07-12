/**
 * Lovable Cloud Adapter
 *
 * 探测 Aetherworld 当前是否运行在已启用 Lovable Cloud 的环境中。
 * 检测依据：VITE_SUPABASE_URL 与 VITE_SUPABASE_PUBLISHABLE_KEY 是否存在。
 *
 * 抽象目标：未来可平滑切换到 SupabaseAdapter / SelfHostAdapter / LocalAdapter。
 */
export type BackendAdapterKind =
  | "LOVABLE_CLOUD"
  | "SUPABASE_EXTERNAL"
  | "LOCAL_STORAGE"
  | "SELF_HOSTED";

export interface BackendAdapterStatus {
  kind: BackendAdapterKind;
  ready: boolean;
  detail: string;
}

export function detectLovableCloud(): BackendAdapterStatus {
  const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || "";
  const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) || "";
  if (url && key) {
    return {
      kind: "LOVABLE_CLOUD",
      ready: true,
      detail: "Lovable Cloud 已启用，可用于数据库、存储、鉴权与边缘函数。",
    };
  }
  return {
    kind: "LOCAL_STORAGE",
    ready: true,
    detail: "未检测到 Lovable Cloud，当前回落到浏览器 LocalStorage。",
  };
}

export const BACKEND_ADAPTERS: { kind: BackendAdapterKind; chineseName: string; note: string }[] = [
  { kind: "LOVABLE_CLOUD",     chineseName: "Lovable 云后端",    note: "推荐默认，免运维。" },
  { kind: "SUPABASE_EXTERNAL", chineseName: "外部 Supabase",     note: "已有 Supabase 项目可对接。" },
  { kind: "LOCAL_STORAGE",     chineseName: "本地存储",          note: "纯前端体验，适合离线 / 隐私场景。" },
  { kind: "SELF_HOSTED",       chineseName: "自托管后端",        note: "预留接口，未来对接私有部署。" },
];
