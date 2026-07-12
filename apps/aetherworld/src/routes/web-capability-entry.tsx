import { createFileRoute, Link } from "@tanstack/react-router";
import { getWebCapabilityModel } from "@/lib/web-capability/webCapabilityRegistry";
import { WEB_CAPABILITY_IDS, type WebCapabilityId } from "@/constants/web-capability/webCapabilityTypes";

type Search = { id?: WebCapabilityId };

export const Route = createFileRoute("/web-capability-entry")({
  validateSearch: (s: Record<string, unknown>): Search => {
    const id = s.id as WebCapabilityId | undefined;
    return { id: id && (WEB_CAPABILITY_IDS as readonly string[]).includes(id) ? id : undefined };
  },
  head: () => ({ meta: [{ title: "Web Capability Entry · 能力模型详情" }] }),
  component: function EntryPage() {
    const { id } = Route.useSearch();
    const model = id ? getWebCapabilityModel(id) : undefined;
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-4">
        <Link to="/web-capabilities" className="text-xs text-primary hover:underline">← 返回能力模型列表</Link>
        {!model && <div className="text-sm text-muted-foreground">未指定能力模型。</div>}
        {model && (
          <article className="space-y-4">
            <header>
              <h1 className="text-2xl font-semibold">{model.name} · {model.chineseName}</h1>
              <div className="text-xs text-muted-foreground mt-1">{model.domain} · v{model.version} · {model.status}</div>
              <p className="text-sm mt-2">{model.description}</p>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <Section title="Input Types" items={model.inputTypes} />
              <Section title="Output Types" items={model.outputTypes} />
              <Section title="Required Knowledge Sources" items={model.requiredKnowledgeSources} />
              <Section title="Required Calculus" items={model.requiredCalculusIds} />
              <Section title="Required Constants" items={model.requiredConstants} />
              <Section title="Tool Interfaces" items={model.toolInterfaces} />
              <Section title="QA Rules" items={model.qaRules} />
              <Section title="Safety Rules" items={model.safetyRules} />
              <Section title="Workspace Object Types" items={model.workspaceObjectTypes} />
            </div>
            <section className="rounded-lg border bg-card p-4">
              <h3 className="text-sm font-semibold mb-2">流程步骤</h3>
              <ol className="text-xs space-y-1 list-decimal list-inside">
                {model.procedureSteps.map((s) => <li key={s.stepId}><span className="font-medium">{s.title}</span> — {s.description}</li>)}
              </ol>
            </section>
            <Link to="/web-capability-run" search={{ id: model.capabilityId }} className="inline-block text-sm px-3 py-1.5 rounded bg-primary text-primary-foreground">运行此能力模型</Link>
          </article>
        )}
      </div>
    );
  },
});

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded border bg-card p-3">
      <div className="text-[11px] font-semibold mb-1">{title}</div>
      <div className="text-muted-foreground">{items.length ? items.join("、") : "—"}</div>
    </div>
  );
}
