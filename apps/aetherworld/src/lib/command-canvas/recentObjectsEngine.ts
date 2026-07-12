import { listCanvasObjects, type CanvasObjectRef } from "./canvasObjectResolver";
export function getRecentObjects(limit = 12): CanvasObjectRef[] {
  return listCanvasObjects().slice(0, limit);
}
