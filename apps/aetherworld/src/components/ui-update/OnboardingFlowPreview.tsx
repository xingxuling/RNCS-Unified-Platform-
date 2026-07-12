import { listOnboardingFlows } from "@/lib/ui-update/onboardingFlowEngine";
import { UISafetyNote } from "./UISafetyNote";

export function OnboardingFlowPreview() {
  const flows = listOnboardingFlows();
  return (
    <div className="space-y-4">
      {flows.map((f) => (
        <section key={f.flowId} className="border rounded-md p-3">
          <h3 className="font-semibold">{f.chineseName} · {f.audience}</h3>
          <ol className="mt-2 space-y-1 text-sm list-decimal pl-5">
            {f.steps.map((s) => (
              <li key={s.stepId}>
                <span className="font-medium">{s.title}</span>
                <span className="text-muted-foreground"> — {s.description} </span>
                <span className="text-xs text-muted-foreground">→ <code>{s.targetRoute}</code></span>
              </li>
            ))}
          </ol>
        </section>
      ))}
      <UISafetyNote />
    </div>
  );
}
