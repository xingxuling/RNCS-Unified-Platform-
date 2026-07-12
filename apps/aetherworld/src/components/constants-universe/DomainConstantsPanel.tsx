import { DOMAIN_CONSTANTS } from "@/constants/constant-universe/domainConstants";

export function DomainConstantsPanel() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {DOMAIN_CONSTANTS.map((d) => (
        <div key={d.domainId} className="border rounded-md p-3">
          <div className="flex items-baseline justify-between">
            <h4 className="font-semibold">
              {d.chineseName} <span className="text-xs text-muted-foreground">位置 {d.position} · {d.name}</span>
            </h4>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{d.meaning.join("、")}</p>
          <p className="text-xs mt-2">
            <span className="text-muted-foreground">影响引擎：</span>
            {d.affectedEngines.join(" / ")}
          </p>
        </div>
      ))}
    </div>
  );
}
