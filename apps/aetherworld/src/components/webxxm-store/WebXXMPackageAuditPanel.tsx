import { getManifest } from "@/lib/webxxm-store/webXXMPackageRegistry";
import { checkCompatibility, evaluatePackageSafety, runPackageQa } from "@/lib/webxxm-store/webXXMPackageSafetyGuard";

export function WebXXMPackageAuditPanel({ packageId }: { packageId: string }) {
  const m = getManifest(packageId);
  if (!m) return <div className="aether-card p-6 text-sm text-muted-foreground">未找到能力包 {packageId}。</div>;
  const sections = [
    { title: "兼容性", r: checkCompatibility(m) },
    { title: "安全", r: evaluatePackageSafety(m) },
    { title: "QA", r: runPackageQa(m) },
  ];
  return (
    <div className="space-y-3">
      {sections.map((s) => (
        <div key={s.title} className="aether-card p-4">
          <div className="flex justify-between items-center">
            <div className="text-sm">{s.title}</div>
            <div className="text-[11px]">{s.r.status}</div>
          </div>
          <ul className="mt-2 text-xs space-y-1 text-muted-foreground">
            {s.r.issues.length === 0 && <li>无问题</li>}
            {s.r.issues.map((i) => <li key={i.ruleId}>· [{i.severity}] {i.message}</li>)}
          </ul>
        </div>
      ))}
    </div>
  );
}
