export type VSRPrimitive = null | boolean | number | string;
export type VSRValue = VSRPrimitive | VSRValue[] | { [key: string]: VSRValue };
export type VSRNodeType = 'group' | 'rect' | 'ellipse' | 'line' | 'path' | 'text' | 'image';
export type VSRSeverity = 'info' | 'warning' | 'error' | 'fatal';

export interface VSRDiagnostic {
  code: string;
  severity: VSRSeverity;
  message: string;
  messageZh?: string;
  path?: string;
  nodeId?: string;
  trackId?: string;
  time?: number;
  suggestion?: string;
  details?: Record<string, VSRValue>;
}

export type VSRPaint =
  | { type: 'solid'; color: string }
  | { type: 'linear-gradient'; x1: number; y1: number; x2: number; y2: number; stops: Array<{ offset: number; color: string }> };

export type VSRLength = number | `${number}%` | `${number}vw` | `${number}vh` | 'auto';
export type VSRValueSource = VSRValue | { binding: string } | { expression: string };
export type VSRNumberSource = number | { binding: string } | { expression: string };
export type VSRStringSource = string | { binding: string } | { expression: string };
export type VSRBooleanSource = boolean | { binding: string } | { expression: string };

export interface VSRMetadata {
  id: string;
  title: string;
  duration: number;
  defaultFps: number;
  seed: number;
  authoringTool?: string;
  createdAt?: string;
  updatedAt?: string;
  description?: string;
}

export interface VSRCanvas {
  width: number;
  height: number;
  pixelRatio?: number;
  background?: VSRPaint;
  layoutMode?: 'fixed' | 'responsive';
  safeArea?: { top?: VSRLength; right?: VSRLength; bottom?: VSRLength; left?: VSRLength };
}

export interface VSRTimeRange { start: number; end?: number; includeEnd?: boolean }
export interface VSRInsets { top?: number; right?: number; bottom?: number; left?: number }
export interface VSRResponsiveRule {
  when: { minWidth?: number; maxWidth?: number; minAspect?: number; maxAspect?: number };
  set: Partial<VSRLayout>;
}
export interface VSRLayout {
  x?: VSRLength; y?: VSRLength; width?: VSRLength; height?: VSRLength;
  anchorX?: number; anchorY?: number;
  minWidth?: number; maxWidth?: number; minHeight?: number; maxHeight?: number;
  aspectRatio?: number;
  alignSelf?: 'start' | 'center' | 'end' | 'stretch';
  padding?: VSRInsets; margin?: VSRInsets;
  responsive?: VSRResponsiveRule[];
}
export interface VSRTransform {
  translateX?: number; translateY?: number; scaleX?: number; scaleY?: number;
  rotation?: number; skewX?: number; skewY?: number; originX?: number; originY?: number;
}
export interface VSRShadow { color: string; blur: number; offsetX?: number; offsetY?: number }
export interface VSRAppearance {
  opacity?: number; fill?: VSRPaint; stroke?: VSRPaint; strokeWidth?: number;
  lineCap?: 'butt' | 'round' | 'square'; lineJoin?: 'miter' | 'round' | 'bevel'; dash?: number[];
  blendMode?: string; shadow?: VSRShadow;
}

export type VSREasing = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'stepStart' | 'stepEnd'
  | { cubicBezier: [number, number, number, number] }
  | { spring: { mass?: number; stiffness?: number; damping?: number; velocity?: number } };
export interface VSRKeyframe { id: string; time: number; value: VSRValue; easing?: VSREasing; hold?: boolean; order?: number }
export interface VSRTrack {
  id: string; property: string; mode: 'keyframes' | 'expression' | 'binding' | 'simulation';
  priority?: number; order?: number; keyframes?: VSRKeyframe[]; expression?: string; binding?: string;
  simulation?: { id: string; config?: Record<string, VSRValue> };
}

export interface VSRNodeBase {
  id: string; type: VSRNodeType; name?: string; parentId?: string; zIndex?: number; order?: number;
  active?: VSRTimeRange; visible?: VSRBooleanSource;
  layout?: VSRLayout; transform?: VSRTransform; appearance?: VSRAppearance;
  tracks?: VSRTrack[]; tags?: string[]; data?: Record<string, VSRValue>;
  extensions?: Record<`${string}:${string}`, unknown>;
}
export interface VSRGroupNode extends VSRNodeBase { type: 'group'; content?: { clip?: boolean; isolation?: boolean } }
export interface VSRRectNode extends VSRNodeBase { type: 'rect'; content?: { cornerRadius?: number | [number, number, number, number] } }
export interface VSREllipseNode extends VSRNodeBase { type: 'ellipse' }
export interface VSRLineNode extends VSRNodeBase { type: 'line'; content: { x1: VSRLength; y1: VSRLength; x2: VSRLength; y2: VSRLength } }
export interface VSRPathNode extends VSRNodeBase { type: 'path'; content: { d: string; fillRule?: 'nonzero' | 'evenodd' } }
export interface VSRTextNode extends VSRNodeBase {
  type: 'text'; content: {
    text: VSRStringSource; fontFamily?: string; fontSize?: VSRNumberSource; fontWeight?: number | 'normal' | 'bold';
    lineHeight?: number; letterSpacing?: number; align?: 'left' | 'center' | 'right'; verticalAlign?: 'top' | 'middle' | 'bottom';
    wrap?: 'none' | 'word' | 'character'; maxLines?: number; overflow?: 'clip' | 'ellipsis';
  };
}
export interface VSRImageNode extends VSRNodeBase { type: 'image'; content: { assetId: string; fit?: 'fill' | 'contain' | 'cover' | 'none'; crop?: VSRRect; smoothing?: boolean } }
export type VSRNode = VSRGroupNode | VSRRectNode | VSREllipseNode | VSRLineNode | VSRPathNode | VSRTextNode | VSRImageNode;

export interface VSRAsset {
  id: string; type: 'image' | 'font' | 'json' | 'binary'; src: string; contentHash?: string; mimeType?: string;
  width?: number; height?: number; policy?: { network?: 'deny' | 'allow'; cache?: 'none' | 'memory' | 'disk' };
}
export interface VSREvent {
  id: string; time: number; type: 'set' | 'merge' | 'increment' | 'toggle' | 'custom'; target: string;
  value?: VSRValue; payload?: Record<string, VSRValue>; order?: number;
}
export interface VSRInteraction {
  id: string; nodeId: string; trigger: 'click' | 'pointerEnter' | 'pointerLeave' | 'pointerMove' | 'keyDown';
  action: { type: 'setVariable'; target: string; value: VSRValueSource } | { type: 'emit'; event: string; payload?: Record<string, VSRValueSource> } | { type: 'seek'; time: VSRNumberSource };
}
export interface VSROutputProfile {
  id: string; type: 'image' | 'video' | 'interactive'; width?: number; height?: number; fps?: number; codec?: string; responsive?: boolean;
}
export interface VSRDocument {
  specVersion: '0.1'; runtimeTarget?: string; metadata: VSRMetadata; canvas: VSRCanvas;
  variables?: Record<string, VSRValue>; assets?: VSRAsset[]; nodes: VSRNode[]; events?: VSREvent[];
  interactions?: VSRInteraction[]; outputs?: VSROutputProfile[]; extensions?: Record<`${string}:${string}`, unknown>;
}

export interface VSRContext {
  width: number; height: number; aspect: number; dpr: number; locale: string;
  fps: number; input?: { pointerX?: number; pointerY?: number; keys?: string[] };
}
export interface VSRState { variables: Record<string, VSRValue>; interaction: Record<string, VSRValue>; runtime: Record<string, VSRValue> }
export interface VSRRect { x: number; y: number; width: number; height: number }
export type VSRMatrix3 = [number, number, number, number, number, number, number, number, number];
export interface VSRResolvedAppearance extends VSRAppearance { opacity: number }
export type VSRResolvedContent = Record<string, VSRValue>;
export interface VSRClip { kind: 'rect'; nodeId: string; worldBounds: VSRRect }
export interface VSRDisplayItem {
  id: string; nodeId: string; type: VSRNodeType; orderKey: string; worldTransform: VSRMatrix3;
  localBounds: VSRRect; worldBounds: VSRRect; opacity: number; appearance: VSRResolvedAppearance;
  content: VSRResolvedContent; parentId?: string; tags?: string[]; sourceTrace?: Record<string, string>; clipStack?: VSRClip[];
}
export interface VSRViewport { width: number; height: number; dpr: number }
export interface VSRDisplayState {
  documentId: string; documentHash: string; runtimeVersion: string; time: number; frame: number;
  viewport: VSRViewport; background?: VSRPaint; items: VSRDisplayItem[]; diagnostics: VSRDiagnostic[]; semanticHash: string;
}

export interface VSRValidationReport { ok: boolean; diagnostics: VSRDiagnostic[] }

function diagnostic(code: string, severity: VSRSeverity, message: string, path?: string, suggestion?: string): VSRDiagnostic {
  return { code, severity, message, messageZh: message, path, suggestion };
}

export function validateDocument(input: unknown): VSRValidationReport {
  const diagnostics: VSRDiagnostic[] = [];
  if (!input || typeof input !== 'object') return { ok: false, diagnostics: [diagnostic('SPEC_DOCUMENT_TYPE', 'fatal', '文档必须是对象。')] };
  const doc = input as Partial<VSRDocument>;
  if (doc.specVersion !== '0.1') diagnostics.push(diagnostic('SPEC_VERSION', 'fatal', '仅支持 specVersion 0.1。', '/specVersion'));
  if (!doc.metadata || typeof doc.metadata !== 'object') diagnostics.push(diagnostic('SPEC_METADATA', 'fatal', '缺少 metadata。', '/metadata'));
  else {
    if (!doc.metadata.id) diagnostics.push(diagnostic('SPEC_METADATA_ID', 'error', 'metadata.id 不能为空。', '/metadata/id'));
    if (!Number.isFinite(doc.metadata.duration) || Number(doc.metadata.duration) < 0) diagnostics.push(diagnostic('SPEC_DURATION', 'error', 'duration 必须是非负有限数。', '/metadata/duration'));
    if (!Number.isFinite(doc.metadata.defaultFps) || Number(doc.metadata.defaultFps) <= 0) diagnostics.push(diagnostic('SPEC_FPS', 'error', 'defaultFps 必须大于 0。', '/metadata/defaultFps'));
    if (!Number.isInteger(doc.metadata.seed)) diagnostics.push(diagnostic('SPEC_SEED', 'error', 'seed 必须是整数。', '/metadata/seed'));
  }
  if (!doc.canvas || typeof doc.canvas !== 'object') diagnostics.push(diagnostic('SPEC_CANVAS', 'fatal', '缺少 canvas。', '/canvas'));
  else if (!(Number(doc.canvas.width) > 0) || !(Number(doc.canvas.height) > 0)) diagnostics.push(diagnostic('SPEC_CANVAS_SIZE', 'error', '画布宽高必须大于 0。', '/canvas'));
  if (!Array.isArray(doc.nodes)) diagnostics.push(diagnostic('SPEC_NODES', 'fatal', 'nodes 必须是数组。', '/nodes'));
  else {
    const ids = new Set<string>();
    const byId = new Map<string, VSRNode>();
    doc.nodes.forEach((node, index) => {
      const path = `/nodes/${index}`;
      if (!node || typeof node !== 'object') { diagnostics.push(diagnostic('SPEC_NODE_TYPE', 'error', '节点必须是对象。', path)); return; }
      if (!node.id || typeof node.id !== 'string') diagnostics.push(diagnostic('SPEC_NODE_ID', 'error', '节点 id 不能为空。', `${path}/id`));
      else if (ids.has(node.id)) diagnostics.push(diagnostic('SPEC_DUPLICATE_NODE_ID', 'error', `节点 id 重复：${node.id}`, `${path}/id`));
      else { ids.add(node.id); byId.set(node.id, node as VSRNode); }
      if (!['group','rect','ellipse','line','path','text','image'].includes(String(node.type))) diagnostics.push(diagnostic('SPEC_NODE_KIND', 'error', `不支持的节点类型：${String(node.type)}`, `${path}/type`));
      node.tracks?.forEach((track, ti) => {
        if (track.mode === 'simulation') diagnostics.push(diagnostic('TRACK_SIMULATION_UNSUPPORTED', 'error', 'v0.1 尚未实现 simulation 轨道。', `${path}/tracks/${ti}`));
        if (track.mode === 'keyframes' && !Array.isArray(track.keyframes)) diagnostics.push(diagnostic('TRACK_KEYFRAMES_REQUIRED', 'error', 'keyframes 轨道必须提供 keyframes。', `${path}/tracks/${ti}`));
      });
    });
    for (const [id, node] of byId) if (node.parentId && !byId.has(node.parentId)) diagnostics.push(diagnostic('SPEC_PARENT_MISSING', 'error', `父节点不存在：${node.parentId}`, `/nodes/${id}/parentId`));
    for (const [id] of byId) {
      const seen = new Set<string>(); let current: string | undefined = id;
      while (current) {
        if (seen.has(current)) { diagnostics.push(diagnostic('SPEC_PARENT_CYCLE', 'fatal', `检测到父子循环：${[...seen, current].join(' → ')}`)); break; }
        seen.add(current); current = byId.get(current)?.parentId;
      }
    }
  }
  return { ok: !diagnostics.some(d => d.severity === 'error' || d.severity === 'fatal'), diagnostics };
}

export function canonicalize(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Cannot canonicalize non-finite number.');
    return Number(value.toFixed(9)).toString();
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  if (typeof value === 'object') {
    const object = value as Record<string, unknown>;
    const keys = Object.keys(object).filter(k => object[k] !== undefined).sort();
    return `{${keys.map(k => `${JSON.stringify(k)}:${canonicalize(object[k])}`).join(',')}}`;
  }
  throw new Error(`Unsupported canonical value: ${typeof value}`);
}

export function fnv1a64(text: string): string {
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  const bytes = new TextEncoder().encode(text);
  for (const byte of bytes) { hash ^= BigInt(byte); hash = BigInt.asUintN(64, hash * prime); }
  return hash.toString(16).padStart(16, '0');
}

export function semanticHash(value: unknown): string { return `fnv1a64:${fnv1a64(canonicalize(value))}`; }

export function documentSemanticView(doc: VSRDocument): unknown {
  return {
    specVersion: doc.specVersion,
    runtimeTarget: doc.runtimeTarget,
    metadata: {
      id: doc.metadata.id, title: doc.metadata.title, duration: doc.metadata.duration,
      defaultFps: doc.metadata.defaultFps, seed: doc.metadata.seed, description: doc.metadata.description
    },
    canvas: doc.canvas, variables: doc.variables ?? {}, assets: doc.assets ?? [], nodes: doc.nodes,
    events: doc.events ?? [], interactions: doc.interactions ?? [], outputs: doc.outputs ?? [], extensions: doc.extensions ?? {}
  };
}

export function documentHash(doc: VSRDocument): string { return semanticHash(documentSemanticView(doc)); }
export function deepClone<T>(value: T): T { return structuredClone(value); }
