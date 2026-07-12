import type { GeneratedModelSchema } from "@/lib/model-generation/modelSchemaBuilder";

export interface ModelRegistryEntry {
  id: string;
  modelName: string;
  modelType: string;
  version: string;
  createdAt: string;
  lastUpdatedAt: string;
  sourceInput: string;
  schema: GeneratedModelSchema;
  tags: string[];
  status: "DRAFT" | "ACTIVE" | "ARCHIVED" | "DEPRECATED";
  stale?: boolean;
  staleReason?: string;
}

const KEY = "aether_model_registry_v1";

function read(): ModelRegistryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ModelRegistryEntry[]) : [];
  } catch {
    return [];
  }
}

function write(list: ModelRegistryEntry[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function listModels(): ModelRegistryEntry[] {
  return read();
}

export function saveModel(schema: GeneratedModelSchema, sourceInput: string, tags: string[] = []): ModelRegistryEntry {
  const list = read();
  const entry: ModelRegistryEntry = {
    id: schema.modelId,
    modelName: schema.modelName,
    modelType: schema.modelType,
    version: schema.version,
    createdAt: schema.createdAt,
    lastUpdatedAt: new Date().toISOString(),
    sourceInput,
    schema,
    tags,
    status: "DRAFT",
  };
  list.unshift(entry);
  write(list);
  return entry;
}

export function updateStatus(id: string, status: ModelRegistryEntry["status"]) {
  const list = read();
  const item = list.find(x => x.id === id);
  if (item) {
    item.status = status;
    item.lastUpdatedAt = new Date().toISOString();
    write(list);
  }
}

export function markStale(id: string, reason: string) {
  const list = read();
  const item = list.find(x => x.id === id);
  if (item) {
    item.stale = true;
    item.staleReason = reason;
    write(list);
  }
}

export function markAllStale(reason: string) {
  const list = read();
  list.forEach(i => { i.stale = true; i.staleReason = reason; });
  write(list);
}

export function deleteModel(id: string) {
  write(read().filter(x => x.id !== id));
}

export function duplicateModel(id: string): ModelRegistryEntry | null {
  const list = read();
  const item = list.find(x => x.id === id);
  if (!item) return null;
  const copy: ModelRegistryEntry = {
    ...item,
    id: `model-${Date.now().toString(36)}`,
    modelName: `${item.modelName} · copy`,
    createdAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    status: "DRAFT",
    stale: false,
    staleReason: undefined,
  };
  list.unshift(copy);
  write(list);
  return copy;
}

export function diffModels(idA: string, idB: string) {
  const list = read();
  const a = list.find(x => x.id === idA);
  const b = list.find(x => x.id === idB);
  if (!a || !b) return null;
  const aFields = new Set(a.schema.fields.map(f => f.fieldName));
  const bFields = new Set(b.schema.fields.map(f => f.fieldName));
  return {
    onlyInA: [...aFields].filter(f => !bFields.has(f)),
    onlyInB: [...bFields].filter(f => !aFields.has(f)),
    common: [...aFields].filter(f => bFields.has(f)),
  };
}
