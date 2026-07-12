import { COMPRESSION_CONSTANTS, NORMAL_USER_DEFAULT_SECTIONS, FOUNDER_EXPANDABLE_SECTIONS } from "@/constants/constant-universe/compressionConstants";

export function CompressionConstantsPanel() {
  return (
    <div className="space-y-3">
      <div className="border rounded-md p-3">
        <h4 className="font-semibold text-sm mb-2">压缩参数</h4>
        <div className="grid gap-1 text-xs">
          {Object.entries(COMPRESSION_CONSTANTS).map(([k, v]) => (
            <div key={k} className="flex justify-between"><span className="font-mono text-muted-foreground">{k}</span><span className="font-mono">{String(v)}</span></div>
          ))}
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="border rounded-md p-3">
          <h4 className="font-semibold text-sm mb-2">普通用户默认章节</h4>
          <ul className="text-xs list-disc pl-5 space-y-0.5">
            {NORMAL_USER_DEFAULT_SECTIONS.map((s) => <li key={s}>{s}</li>)}
          </ul>
        </div>
        <div className="border rounded-md p-3">
          <h4 className="font-semibold text-sm mb-2">Founder 可展开章节</h4>
          <ul className="text-xs list-disc pl-5 space-y-0.5">
            {FOUNDER_EXPANDABLE_SECTIONS.map((s) => <li key={s}>{s}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}
