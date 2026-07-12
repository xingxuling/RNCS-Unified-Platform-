import type { ChatDisplayResult, ChatResultAction } from "@/lib/chat/chatDisplayResultTypes";
import { ChatResultBaseCard } from "./ChatResultBaseCard";
import { Monitor, Tablet, Smartphone } from "lucide-react";

interface Props {
  result: ChatDisplayResult;
  onAction?: (a: ChatResultAction, r: ChatDisplayResult) => void;
}

interface AppPreview {
  appName?: string;
  coreFeatures?: string[];
  generated?: string[];
}

/**
 * 应用结果卡。
 * 桌面端额外显示设备预览缩略图条（桌面 / 平板 / 手机），让用户在对话中
 * 第一眼就感知到「这是一个跨端应用」，而不是抽象的功能列表。
 */
export function ChatAppResultCard({ result, onAction }: Props) {
  const p = (result.structuredPreview ?? {}) as AppPreview;
  return (
    <ChatResultBaseCard result={result} onAction={onAction} accent="primary">
      <dl className="grid grid-cols-1 gap-1 text-xs">
        {p.appName && <Row label="应用名称" value={p.appName} />}
        {p.coreFeatures?.length ? <Row label="核心功能" value={p.coreFeatures.join("、")} /> : null}
        {p.generated?.length    ? <Row label="已生成"  value={p.generated.join("、")} /> : null}
      </dl>

      <div className="mt-2 hidden sm:flex items-stretch gap-2">
        <DeviceThumb icon={<Monitor className="w-3 h-3" />} label="桌面" ratio="aspect-[16/10]" />
        <DeviceThumb icon={<Tablet className="w-3 h-3" />}  label="平板" ratio="aspect-[3/4]" />
        <DeviceThumb icon={<Smartphone className="w-3 h-3" />} label="手机" ratio="aspect-[9/16]" />
      </div>
    </ChatResultBaseCard>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="text-muted-foreground shrink-0">{label}：</dt>
      <dd className="text-foreground/90 break-words">{value}</dd>
    </div>
  );
}

function DeviceThumb({
  icon, label, ratio,
}: { icon: React.ReactNode; label: string; ratio: string }) {
  return (
    <div className="flex-1 min-w-0 rounded-md border border-border/50 bg-background/40 p-1.5 flex flex-col items-center gap-1">
      <div className={`w-full ${ratio} rounded-sm bg-gradient-to-br from-muted/40 to-background/40 border border-border/40`} />
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        {icon}<span>{label}</span>
      </div>
    </div>
  );
}
