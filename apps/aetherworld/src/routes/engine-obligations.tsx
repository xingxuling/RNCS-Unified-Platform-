import { createFileRoute } from "@tanstack/react-router";
import { ENGINE_OBLIGATIONS } from "@/constants/constitution/engineObligations";

export const Route = createFileRoute("/engine-obligations")({
  head: () => ({
    meta: [
      { title: "引擎义务 · Engine Obligations · Aetherworld 系统宪法" },
      { name: "description", content: "所有引擎对常数宇宙与系统宪法的强制义务、必检条款与输出元数据要求。" },
      { property: "og:title", content: "Engine Obligations · Aetherworld" },
      { property: "og:description", content: "引擎治理 · 必检条款 · 元数据合约" },
    ],
  }),
  component: EngineObligationsPage,
});

function EngineObligationsPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">引擎义务 · Engine Obligations</h1>
        <p className="text-sm text-muted-foreground">
          每个引擎必须读取的常数、必检的宪法条款，以及输出 metadata 中必带的合规字段。
        </p>
      </header>
      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="p-2">引擎</th>
              <th className="p-2">中文名</th>
              <th className="p-2">必读常数</th>
              <th className="p-2">必检条款</th>
            </tr>
          </thead>
          <tbody>
            {ENGINE_OBLIGATIONS.map((e) => (
              <tr key={e.engineId} className="border-t align-top">
                <td className="p-2 font-mono">{e.engineId}</td>
                <td className="p-2">{e.chineseName}</td>
                <td className="p-2 text-xs">{e.mustReadConstants.join(", ") || "—"}</td>
                <td className="p-2 text-xs">{e.mustCheckArticles.join(", ") || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
