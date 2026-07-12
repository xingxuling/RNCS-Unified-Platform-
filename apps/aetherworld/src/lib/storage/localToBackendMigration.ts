import { aetherApi } from "@/lib/api/aetherApiClient";
import { writeAuditLog } from "@/lib/api/auditApi";

const FLAG = "aether.migration.local-to-backend.done";

export interface MigrationReport {
  objects: number;
  chats: number;
  runs: number;
  webxxm: number;
  modelStates: number;
}

export function hasLocalDataToMigrate(): boolean {
  if (typeof window === "undefined") return false;
  if (localStorage.getItem(FLAG)) return false;
  const keys = ["aether.canvas.objects", "aether.runs", "aether.webxxm.packages", "aether.first-use.core-model"];
  return keys.some((k) => !!localStorage.getItem(k));
}

export function markMigrationDone() {
  if (typeof window !== "undefined") localStorage.setItem(FLAG, new Date().toISOString());
}

async function safeParse<T>(key: string, fallback: T): Promise<T> {
  try { return JSON.parse(localStorage.getItem(key) ?? "") ?? fallback; } catch { return fallback; }
}

export async function runLocalToBackendMigration(): Promise<MigrationReport> {
  const report: MigrationReport = { objects: 0, chats: 0, runs: 0, webxxm: 0, modelStates: 0 };

  const objs = await safeParse<any[]>("aether.canvas.objects", []);
  for (const o of Array.isArray(objs) ? objs : []) {
    try {
      await aetherApi.objects.create({
        object_type: o.type ?? "OBJECT",
        title: o.title ?? o.name ?? "未命名对象",
        summary: o.summary,
        data_json: o,
      });
      report.objects++;
    } catch {}
  }

  const runs = await safeParse<any[]>("aether.runs", []);
  for (const r of Array.isArray(runs) ? runs : []) {
    try {
      await aetherApi.runs.create({ run_type: r.type ?? "GENERIC", title: r.title, input_json: r });
      report.runs++;
    } catch {}
  }

  const pkgs = await safeParse<any[]>("aether.webxxm.packages", []);
  for (const p of Array.isArray(pkgs) ? pkgs : []) {
    try {
      await aetherApi.webxxm.upsert({
        package_id: p.id ?? p.packageId ?? "unknown",
        name: p.name ?? "未命名能力包",
        status: p.status ?? "AVAILABLE",
        capability_id: p.capabilityId,
        version: p.version,
        manifest_json: p.manifest ?? {},
      });
      report.webxxm++;
    } catch {}
  }

  const fu = await safeParse<any>("aether.first-use.core-model", null);
  if (fu) {
    for (const [type, status] of [["WebLLM", fu.webLlmStatus], ["WebLCM", fu.webLcmStatus], ["WebLKM", fu.webLkmStatus]] as const) {
      if (status) {
        try { await aetherApi.modelStates.upsert({ model_type: type, status }); report.modelStates++; } catch {}
      }
    }
  }

  await writeAuditLog({ action: "migrate_local_to_backend", riskLevel: "LOW", metadata: { ...report } });
  markMigrationDone();
  return report;
}
