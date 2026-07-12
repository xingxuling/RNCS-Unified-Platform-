// 对象创建桥：实际对象由 commandCanvas runtime 注册到 canvasObjectResolver。
// 本桥仅提供类型映射与标题构造，便于 Chat UI 展示。
export function buildObjectTitle(objectType: string, raw: string): string {
  return `${objectType} · ${raw.slice(0, 24)}`;
}
