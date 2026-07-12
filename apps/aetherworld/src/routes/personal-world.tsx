import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { generatePersonalWorld } from "@/lib/worldGenerationEngine";
import { PersonalWorldOverview } from "@/components/PersonalWorldOverview";
import { getWorldMode } from "@/constants/worldGenerationModes";
import { getSequenceMode } from "@/lib/realSubjectStore";

export const Route = createFileRoute("/personal-world")({
  head: () => ({
    meta: [
      { title: "个人世界 · Personal World" },
      { name: "description", content: "你的个人世界模型：世界法则、事件地图、角色与下一步建议。" },
    ],
  }),
  component: PersonalWorldPage,
});

function PersonalWorldPage() {
  const data = useMemo(() => {
    if (typeof window === "undefined") return null;
    let input: any = null;
    try { input = JSON.parse(window.localStorage.getItem("aether.personalWorld.input.v1") || "null"); } catch { /* noop */ }
    if (!input) {
      input = { subjectMode: getSequenceMode(), selectedMode: "DEMO_WORLD", narrativeStyle: "friendly" };
    }
    const result = generatePersonalWorld(input);
    const mode = getWorldMode(input.selectedMode);
    return { result, mode };
  }, []);

  if (!data) {
    return <div className="p-10 text-muted-foreground">个人世界加载中…</div>;
  }

  return (
    <>
      <PageHeader caption="Personal World · 个人世界"
        title={data.result.worldName}
        subtitle={data.result.worldSubtitle}
        actions={
          <Link to="/world-generator"
            className="text-xs px-3 py-1.5 rounded-md border border-border hover:border-primary/50">
            重新生成
          </Link>
        }
      />
      <div className="p-6 md:p-10">
        <PersonalWorldOverview
          result={data.result}
          modeName={data.mode.name}
          privacyNote={data.mode.privacyNote}
        />
      </div>
    </>
  );
}
