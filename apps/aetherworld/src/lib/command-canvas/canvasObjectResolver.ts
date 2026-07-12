import type { CanvasObjectType } from "@/constants/command-canvas/canvasObjectTypes";

export interface CanvasObjectRef {
  id: string;
  type: CanvasObjectType;
  title: string;
  summary?: string;
  createdAt: string;
  source?: string;
}

const REGISTRY = new Map<string, CanvasObjectRef>();

export function registerCanvasObject(ref: Omit<CanvasObjectRef, "createdAt"> & { createdAt?: string }): CanvasObjectRef {
  const full: CanvasObjectRef = { createdAt: new Date().toISOString(), ...ref };
  REGISTRY.set(full.id, full);
  return full;
}

export function getCanvasObject(id: string): CanvasObjectRef | undefined {
  return REGISTRY.get(id);
}

export function listCanvasObjects(): CanvasObjectRef[] {
  return Array.from(REGISTRY.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function resolveCanvasObject(id?: string): CanvasObjectRef | undefined {
  if (!id) return listCanvasObjects()[0];
  return REGISTRY.get(id);
}
