import { useEffect, useState } from "react";

export function CoreModelDeviceCheck() {
  const [info, setInfo] = useState<{ gpu: boolean; storage: boolean; mem?: number } | null>(null);
  useEffect(() => {
    (async () => {
      let gpu = false;
      try {
        if ((navigator as any).gpu) {
          const a = await (navigator as any).gpu.requestAdapter?.();
          gpu = !!a;
        }
      } catch {}
      const storage = typeof localStorage !== "undefined";
      const mem = (navigator as any).deviceMemory;
      setInfo({ gpu, storage, mem });
    })();
  }, []);
  if (!info) return <div className="text-xs text-muted-foreground">正在检测设备…</div>;
  return (
    <div className="text-xs text-muted-foreground space-y-1">
      <div>WebGPU：<span className={info.gpu ? "text-emerald-400" : "text-amber-400"}>{info.gpu ? "可用" : "不可用（将进入规则模式）"}</span></div>
      <div>本地存储：<span className={info.storage ? "text-emerald-400" : "text-rose-400"}>{info.storage ? "可用" : "不可用"}</span></div>
      {info.mem && <div>设备内存：约 {info.mem} GB</div>}
    </div>
  );
}
