import { useState, ReactNode } from "react";
import { Monitor, Tablet, Smartphone } from "lucide-react";

export type DeviceKind = "DESKTOP" | "TABLET" | "MOBILE";

const FRAMES: Record<DeviceKind, { label: string; w: number; h: number; icon: typeof Monitor }> = {
  DESKTOP: { label: "桌面", w: 1280, h: 800, icon: Monitor },
  TABLET:  { label: "平板", w: 768,  h: 1024, icon: Tablet },
  MOBILE:  { label: "手机", w: 390,  h: 760, icon: Smartphone },
};

interface DeviceSimulatorProps {
  /** 预览内容，可传 iframe / 真实组件 / 截图占位 */
  children?: ReactNode;
  /** 默认设备 */
  defaultDevice?: DeviceKind;
  /** 占位文案（如尚未生成预览） */
  placeholder?: string;
  className?: string;
}

/**
 * 设备模拟器。
 * 用于 App Runtime / Code Sandbox / Showcase 中预览同一界面在三种设备上的样子。
 * 不绕过真实渲染，只是把 children 包在按比例缩放的设备外框里。
 */
export function DeviceSimulator({
  children,
  defaultDevice = "DESKTOP",
  placeholder = "尚未生成预览内容",
  className = "",
}: DeviceSimulatorProps) {
  const [device, setDevice] = useState<DeviceKind>(defaultDevice);
  const cur = FRAMES[device];

  // 等比缩放到容器最大宽度 640px
  const maxW = 640;
  const scale = Math.min(1, maxW / cur.w);
  const scaledH = cur.h * scale;

  return (
    <div className={`rounded-xl border border-border/50 bg-background/40 ${className}`}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/40">
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          设备预览 · {cur.label} · {cur.w}×{cur.h}
        </div>
        <div className="flex items-center gap-1">
          {(Object.keys(FRAMES) as DeviceKind[]).map((k) => {
            const F = FRAMES[k];
            const Icon = F.icon;
            const active = k === device;
            return (
              <button
                key={k}
                onClick={() => setDevice(k)}
                aria-label={F.label}
                className={`p-1.5 rounded ${
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-center p-4 overflow-hidden">
        <div
          className="rounded-lg border border-border/60 bg-card shadow-inner overflow-hidden"
          style={{
            width: cur.w * scale,
            height: scaledH,
          }}
        >
          <div
            style={{
              width: cur.w,
              height: cur.h,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
            className="bg-background"
          >
            {children ?? (
              <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                {placeholder}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
