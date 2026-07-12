# Visual State Runtime（VSR）v0.1.0 技术文档

**文档性质：** 技术架构 / 数据契约 / 算法语义 / 接口规范  
**目标实现：** TypeScript Reference Runtime  
**核心原则：** 确定性、后端独立、任意时间求值、结构化编辑、可验证  
**状态：** 可直接开发基线

---

# 1. 系统定义

VSR 将视觉输出定义为：

```text
VisualState(t, S, E, C, R) → DisplayState
```

参考实现 API：

```ts
export interface VSREvaluateRequest {
  document: VSRDocument;
  time: number;
  context: VSRContext;
  initialState?: VSRState;
  events?: VSREvent[];
  runtimeOverrides?: VSRRuntimeOverrides;
}

export interface VSREvaluateResult {
  state: VSRState;
  displayState: VSRDisplayState;
  diagnostics: VSRDiagnostic[];
  semanticHash: string;
  evaluationStats: VSREvaluationStats;
}

export function evaluateAt(
  request: VSREvaluateRequest
): VSREvaluateResult;
```

Core 输出 `VSRDisplayState`，不直接绘制像素。

---

# 2. 分层架构

```text
Intent / Script / Data / RFE ObserverProjection
                         ↓
Compiler / SDK / Studio / Agent Protocol
                         ↓
Visual IR + Assets + Events + Outputs
                         ↓
Validator → Migrator → Normalizer
                         ↓
Clock → Reducer → Binding → Expression → Animation
                         ↓
Layout → Transform → Visibility → Display List
                         ↓
Backend-neutral VSRDisplayState
             ↓                         ↓
        Null Backend              Canvas Backend
                                      ↓
                      Screen / PNG / Frames / Video
```

依赖方向必须单向：

```text
spec
↑
expression  layout
↑          ↑
core
↑
backends / renderer / agent / adapter
↑
cli / studio
```

禁止 `core → studio`、`core → React`、`core → FFmpeg`。

---

# 3. Monorepo 包边界

## `@vsr/spec`

负责：

- TypeScript 类型；
- JSON Schema；
- 版本常量；
- diagnostics；
- canonical serialization；
- semantic hash；
- migration API。

## `@vsr/expression`

负责：

- tokenizer；
- parser；
- AST；
- dependency extraction；
- sandbox evaluator；
- deterministic math。

## `@vsr/layout`

负责：

- length 解析；
- anchor；
- responsive constraints；
- text measure abstraction；
- local bounds；
- layout diagnostics。

## `@vsr/core`

负责：

- document preparation；
- event reducer；
- track evaluation；
- visibility；
- transforms；
- display state；
- runtime session；
- logical clock。

## `@vsr/backend-null`

负责：

- capability negotiation；
- draw command serialization；
- conformance test。

## `@vsr/backend-canvas`

负责：

- browser canvas；
- node canvas；
- resources；
- drawing；
- capture。

## `@vsr/renderer`

负责：

- frame sampling；
- render jobs；
- manifests；
- encoders；
- progress/cancel。

## `@vsr/agent-protocol`

负责：

- transaction schema；
- patch engine；
- preconditions；
- diff；
- inverse；
- undo/redo；
- audit。

## `@vsr/adapter-rfe`

负责：

- ObserverProjection contract；
- visual semantic mapping；
- interaction intent；
- projection metadata。

## `@vsr/cli`

负责非交互命令。

## `apps/studio`

负责中文编辑器，不拥有核心语义。

---

# 4. Visual IR 数据模型

## 4.1 文档

```ts
export interface VSRDocument {
  specVersion: "0.1";
  runtimeTarget?: string;

  metadata: VSRMetadata;
  canvas: VSRCanvas;

  variables?: Record<string, VSRValue>;
  assets?: VSRAsset[];
  nodes: VSRNode[];
  events?: VSREvent[];
  interactions?: VSRInteraction[];
  outputs?: VSROutputProfile[];

  extensions?: Record<`${string}:${string}`, unknown>;
}
```

```ts
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
```

时间单位统一为秒，必须为有限非负数。内部可使用整数微秒或有理帧位置避免累计误差，但公共 API 使用秒。

## 4.2 画布

```ts
export interface VSRCanvas {
  width: number;
  height: number;
  pixelRatio?: number;
  background?: VSRPaint;
  layoutMode?: "fixed" | "responsive";
  safeArea?: {
    top?: VSRLength;
    right?: VSRLength;
    bottom?: VSRLength;
    left?: VSRLength;
  };
}
```

## 4.3 节点基类

```ts
export interface VSRNodeBase {
  id: string;
  type: VSRNodeType;
  name?: string;

  parentId?: string;
  zIndex?: number;
  order?: number;

  active?: VSRTimeRange;
  visible?: VSRBooleanSource;

  layout?: VSRLayout;
  transform?: VSRTransform;
  appearance?: VSRAppearance;

  tracks?: VSRTrack[];
  behaviors?: VSRBehavior[];

  tags?: string[];
  data?: Record<string, VSRValue>;
  extensions?: Record<`${string}:${string}`, unknown>;
}
```

节点 ID 在文档内唯一。父子关系由 `parentId` 作为唯一事实来源，文档准备阶段建立 children index，禁止同时维护两个可能冲突的权威结构。

## 4.4 节点联合类型

```ts
export type VSRNode =
  | VSRGroupNode
  | VSRRectNode
  | VSREllipseNode
  | VSRLineNode
  | VSRPathNode
  | VSRTextNode
  | VSRImageNode;
```

### Group

```ts
export interface VSRGroupNode extends VSRNodeBase {
  type: "group";
  content?: {
    clip?: boolean;
    isolation?: boolean;
  };
}
```

### Rect

```ts
export interface VSRRectNode extends VSRNodeBase {
  type: "rect";
  content?: {
    cornerRadius?: number | [number, number, number, number];
  };
}
```

### Ellipse

```ts
export interface VSREllipseNode extends VSRNodeBase {
  type: "ellipse";
}
```

### Line

```ts
export interface VSRLineNode extends VSRNodeBase {
  type: "line";
  content: {
    x1: VSRLength;
    y1: VSRLength;
    x2: VSRLength;
    y2: VSRLength;
  };
}
```

### Path

```ts
export interface VSRPathNode extends VSRNodeBase {
  type: "path";
  content: {
    d: string;
    fillRule?: "nonzero" | "evenodd";
  };
}
```

首版 path 可以使用 Canvas `Path2D` 支持的 SVG path 子集；Node 端如库不支持完整 `Path2D`，必须使用明确的解析器或限制 Schema，并返回诊断。

### Text

```ts
export interface VSRTextNode extends VSRNodeBase {
  type: "text";
  content: {
    text: VSRStringSource;
    fontFamily?: string;
    fontSize?: VSRNumberSource;
    fontWeight?: number | "normal" | "bold";
    lineHeight?: number;
    letterSpacing?: number;
    align?: "left" | "center" | "right";
    verticalAlign?: "top" | "middle" | "bottom";
    wrap?: "none" | "word" | "character";
    maxLines?: number;
    overflow?: "clip" | "ellipsis";
  };
}
```

### Image

```ts
export interface VSRImageNode extends VSRNodeBase {
  type: "image";
  content: {
    assetId: string;
    fit?: "fill" | "contain" | "cover" | "none";
    crop?: VSRRect;
    smoothing?: boolean;
  };
}
```

---

# 5. 值、源和属性路径

```ts
export type VSRPrimitive = null | boolean | number | string;
export type VSRValue =
  | VSRPrimitive
  | VSRValue[]
  | { [key: string]: VSRValue };
```

属性可来自：

```ts
export type VSRNumberSource =
  | number
  | { binding: string }
  | { expression: string };

export type VSRStringSource =
  | string
  | { binding: string }
  | { expression: string };

export type VSRBooleanSource =
  | boolean
  | { binding: string }
  | { expression: string };
```

轨道使用规范化属性路径，例如：

```text
layout.x
layout.width
transform.rotation
appearance.opacity
appearance.fill
content.text
content.fontSize
```

属性路径必须经过白名单注册和类型检查，不能允许任意原型链路径。

---

# 6. 时间与轨道

## 6.1 时间范围

```ts
export interface VSRTimeRange {
  start: number;
  end?: number;
  includeEnd?: boolean;
}
```

默认 `[start, end)`。文档结束时可特殊包含最终采样。

## 6.2 Track

```ts
export interface VSRTrack {
  id: string;
  property: string;
  mode: "keyframes" | "expression" | "binding" | "simulation";
  priority?: number;

  keyframes?: VSRKeyframe[];
  expression?: string;
  binding?: string;
  simulation?: VSRSimulationRef;
}
```

```ts
export interface VSRKeyframe {
  id: string;
  time: number;
  value: VSRValue;
  easing?: VSREasing;
  hold?: boolean;
}
```

同时间关键帧排序：

```text
time 升序
→ 显式 order 升序
→ 文档中出现顺序
→ id 字典序作为最终稳定 tie-breaker
```

某时间存在多个关键帧时，最后一个稳定排序项生效，并产生 warning。

## 6.3 属性来源优先级

```text
Base
< Binding
< Expression
< Keyframe
< Runtime Override
```

同级多个轨道：

```text
priority 升序
→ track order
→ track id
```

后项覆盖前项。所有覆盖写入 evaluation trace。

---

# 7. 逻辑时钟

```ts
export interface VSRClock {
  readonly duration: number;
  readonly fps: number;
  readonly time: number;
  readonly rate: number;
  readonly status: "playing" | "paused" | "stopped";

  play(): void;
  pause(): void;
  stop(): void;
  seek(time: number): void;
  step(frames: number): void;
  setRate(rate: number): void;
  subscribe(listener: VSRClockListener): () => void;
}
```

实时模式：

- `requestAnimationFrame` 只负责提供显示机会；
- runtime 根据单调时间计算逻辑时间；
- 每帧调用 `evaluateAt`；
- seek 直接设置逻辑时间。

离线模式：

```ts
function frameTime(
  frameIndex: number,
  fps: number,
  startTime = 0
): number {
  return startTime + frameIndex / fps;
}
```

内部建议使用：

```text
timeUs = round(seconds × 1_000_000)
```

或使用 `{frameIndex, fps}`，避免重复浮点累加。

---

# 8. 状态与事件归约

## 8.1 状态

```ts
export interface VSRState {
  variables: Record<string, VSRValue>;
  interaction: Record<string, VSRValue>;
  runtime: Record<string, VSRValue>;
}
```

## 8.2 事件

```ts
export interface VSREvent {
  id: string;
  time: number;
  type: "set" | "merge" | "increment" | "toggle" | "custom";
  target: string;
  value?: VSRValue;
  payload?: Record<string, VSRValue>;
  order?: number;
}
```

首版 custom 事件必须通过注册的纯函数 handler，handler 声明：

```ts
export interface VSREventHandler {
  type: string;
  reduce(
    previous: Readonly<VSRState>,
    event: Readonly<VSREvent>,
    context: Readonly<VSREventContext>
  ): VSRState;
}
```

禁止 handler 访问文件、网络、系统时间或全局随机。

## 8.3 归约

```text
State(t) = Reduce(
  InitialState,
  StableSort(Events where event.time <= t)
)
```

排序：

```text
time → order → id
```

状态使用不可变更新或结构共享。评估器不得修改原文档。

## 8.4 快照

v0.1 只定义：

```ts
export interface VSRSnapshot {
  specVersion: string;
  documentHash: string;
  runtimeVersion: string;
  time: number;
  seed: number;
  state: VSRState;
  snapshotHash: string;
}
```

可选使用最近合法快照优化，但无快照时结果必须一致。

---

# 9. 表达式语言

## 9.1 语法

首版支持：

```text
literal
identifier
member access on whitelisted roots
unary
binary
logical
conditional
function call
array literal
```

不支持：

- assignment；
- loop；
- function declaration；
- object construction；
- `this`；
- `new`；
- import；
- template execution；
- dynamic property name；
- prototype access。

## 9.2 根对象

```text
time
frame
fps
vars
context
input
node
```

`node` 只包含当前节点已求值基础属性的只读快照，禁止跨节点任意访问。跨节点依赖通过明确 binding 注册，避免循环和隐藏依赖。

## 9.3 执行预算

```ts
export interface VSRExpressionBudget {
  maxAstNodes: number;
  maxDepth: number;
  maxSteps: number;
  maxStringLength: number;
  maxArrayLength: number;
}
```

超预算返回诊断，不允许挂死主线程。

## 9.4 随机

采用固定算法，例如 `xoshiro128**` 或 `mulberry32`，算法版本写入 runtime version。

```ts
random(seed, index)
```

不得消费隐式流位置，否则求值顺序变化会改变结果。推荐使用哈希式随机：

```text
value = PRF(documentSeed, nodeId, trackId, index)
```

## 9.5 Noise

`noise1D/2D` 输入必须显式包含 seed 或从文档 seed 与调用位置稳定派生。实现版本必须固定。

---

# 10. Keyframe 与插值

## 10.1 数值

```text
value = a + (b - a) × easedProgress
```

## 10.2 颜色

统一解析为线性或 sRGB RGBA。v0.1 可选择 sRGB 插值，但必须文档化且固定。

支持：

- `#RGB`
- `#RGBA`
- `#RRGGBB`
- `#RRGGBBAA`
- `rgb()`
- `rgba()`

## 10.3 角度

默认按数值线性插值。可选 `shortest` 模式后续增加。

## 10.4 离散值

字符串、布尔、对象默认使用 step 语义：

- progress < 1：前值；
- progress = 1：后值。

## 10.5 Cubic Bezier

```ts
type VSREasing =
  | "linear"
  | "easeIn"
  | "easeOut"
  | "easeInOut"
  | "stepStart"
  | "stepEnd"
  | { cubicBezier: [number, number, number, number] }
  | { spring: VSRSpringConfig };
```

Bezier 求逆必须有固定迭代次数和容差。

## 10.6 Spring

Spring 不得依赖历史帧积分。使用解析解或在 `time` 上可直接求值的确定性函数。

---

# 11. 布局系统

## 11.1 Length

```ts
export type VSRLength =
  | number
  | `${number}%`
  | `${number}vw`
  | `${number}vh`
  | "auto";
```

## 11.2 Layout

```ts
export interface VSRLayout {
  x?: VSRLength;
  y?: VSRLength;
  width?: VSRLength;
  height?: VSRLength;

  anchorX?: number;
  anchorY?: number;

  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;

  aspectRatio?: number;
  alignSelf?: "start" | "center" | "end" | "stretch";

  padding?: VSRInsets;
  margin?: VSRInsets;

  responsive?: VSRResponsiveRule[];
}
```

首版不需要复制完整 CSS Flex/Grid。响应式通过断点规则和父容器相对尺寸实现。

```ts
export interface VSRResponsiveRule {
  when: {
    minWidth?: number;
    maxWidth?: number;
    minAspect?: number;
    maxAspect?: number;
  };
  set: Partial<VSRLayout>;
}
```

规则按文档顺序应用，后规则覆盖前规则。

## 11.3 布局步骤

```text
Resolve canvas and safe area
→ Resolve responsive overrides
→ Resolve parent content box
→ Resolve width/height
→ Apply aspect
→ Apply min/max
→ Resolve x/y
→ Apply anchor
→ Measure text/image intrinsic size
→ Produce local bounds
```

循环依赖，例如父 auto 依赖子百分比、子百分比依赖父 auto，必须返回诊断并采用明确 fallback。

---

# 12. Transform

```ts
export interface VSRTransform {
  translateX?: number;
  translateY?: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
  skewX?: number;
  skewY?: number;
  originX?: number;
  originY?: number;
}
```

使用 3×3 仿射矩阵。

```text
WorldMatrix(node) =
  WorldMatrix(parent)
  × Translate(layout position)
  × Translate(origin)
  × Translate
  × Rotate
  × Skew
  × Scale
  × Translate(-origin)
```

矩阵乘法顺序必须固定并测试。

---

# 13. Appearance 与 Paint

```ts
export interface VSRAppearance {
  opacity?: number;
  fill?: VSRPaint;
  stroke?: VSRPaint;
  strokeWidth?: number;
  lineCap?: "butt" | "round" | "square";
  lineJoin?: "miter" | "round" | "bevel";
  dash?: number[];
  blendMode?: string;
  shadow?: VSRShadow;
}
```

```ts
export type VSRPaint =
  | { type: "solid"; color: string }
  | {
      type: "linear-gradient";
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      stops: Array<{ offset: number; color: string }>;
    };
```

opacity 需要乘上父级累计透明度。

---

# 14. DisplayState

```ts
export interface VSRDisplayState {
  documentId: string;
  documentHash: string;
  runtimeVersion: string;
  time: number;
  frame: number;
  viewport: VSRViewport;
  background?: VSRPaint;
  items: VSRDisplayItem[];
  resources: VSRResolvedResource[];
  diagnostics: VSRDiagnostic[];
  semanticHash: string;
}
```

```ts
export interface VSRDisplayItem {
  id: string;
  nodeId: string;
  type: VSRNodeType;
  orderKey: string;

  worldTransform: VSRMatrix3;
  localBounds: VSRRect;
  worldBounds: VSRRect;

  opacity: number;
  clipStack: VSRClip[];
  appearance: VSRResolvedAppearance;
  content: VSRResolvedContent;

  hitRegion?: VSRHitRegion;
  tags?: string[];
  sourceTrace?: VSRSourceTrace;
}
```

`DisplayState` 必须可序列化。资源对象本身不直接进入语义哈希，只使用规范化资源 ID、内容哈希和元数据。

---

# 15. 稳定排序

绘制顺序：

```text
parent layer order
→ zIndex
→ explicit order
→ source document index
→ node id
```

所有字段必须在 document preparation 阶段转换为 `orderKey`。禁止依赖普通对象属性枚举顺序。

---

# 16. 资源系统

```ts
export interface VSRAsset {
  id: string;
  type: "image" | "font" | "json" | "binary";
  src: string;
  contentHash?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  policy?: {
    network?: "deny" | "allow";
    cache?: "none" | "memory" | "disk";
  };
}
```

默认策略：

- 相对本地文件允许；
- 网络 URL 拒绝，除非宿主显式开启；
- data URL 设置大小上限；
- 内容加载后计算 hash；
- 解码失败返回资源诊断；
- 资源缺失不应崩溃整个进程，可配置 `error` 或 `placeholder`。

Studio 可显示占位图，但离线严格模式应失败。

---

# 17. 后端契约

```ts
export interface VSRBackendCapabilities {
  text: boolean;
  images: boolean;
  vectorPaths: boolean;
  gradients: boolean;
  shadows: boolean;
  clipping: boolean;
  blendModes: string[];
  filters: string[];
  videoTextures: boolean;
  shaders: boolean;
  compute: boolean;
  threeDimensional: boolean;
  hdr: boolean;
  captureFormats: string[];
}
```

```ts
export interface VSRRenderBackend {
  readonly id: string;
  readonly version: string;
  readonly capabilities: VSRBackendCapabilities;

  initialize(context: VSRBackendContext): Promise<void>;
  resize(viewport: VSRViewport): Promise<void>;
  render(state: VSRDisplayState): Promise<VSRRenderResult>;
  capture?(options: VSRCaptureOptions): Promise<Uint8Array>;
  dispose(): Promise<void>;
}
```

能力协商：

```text
Document Requirements
∩ Backend Capabilities
→ Supported
→ Fallback
→ Diagnostic
→ Strict failure or lenient degradation
```

所有降级必须可观察。

---

# 18. Null Backend

Null Backend 输出：

```ts
export interface VSRNullRenderResult {
  commands: VSRDrawCommand[];
  commandHash: string;
  itemCount: number;
  bounds: VSRRect;
}
```

Draw Command 示例：

```ts
type VSRDrawCommand =
  | { op: "save" }
  | { op: "restore" }
  | { op: "transform"; matrix: VSRMatrix3 }
  | { op: "clip"; path: VSRPathData }
  | { op: "fillRect"; rect: VSRRect; paint: VSRPaint }
  | { op: "strokeRect"; rect: VSRRect; paint: VSRPaint; width: number }
  | { op: "fillText"; text: string; layout: VSRTextLayout; paint: VSRPaint }
  | { op: "drawImage"; assetId: string; source?: VSRRect; dest: VSRRect };
```

Null Backend 是 conformance 基准，不代表像素输出。

---

# 19. Canvas Backend

## 19.1 抽象

```ts
export interface VSRCanvasSurface {
  width: number;
  height: number;
  getContext2D(): VSRCanvas2DContext;
  encode(format: "png" | "jpeg" | "webp", quality?: number): Promise<Uint8Array>;
}
```

浏览器实现包装 `HTMLCanvasElement`，Node 实现包装 `@napi-rs/canvas`。

## 19.2 渲染流程

```text
reset transform
→ clear
→ draw background
→ for item in stable order:
    save
    apply clip stack
    apply world transform
    apply alpha/blend/shadow
    draw content
    restore
```

## 19.3 文本差异

不同平台字体栅格可能产生像素差异。因此：

- 语义测试使用 text layout metrics 和 Null 命令；
- 同一 CI 环境可使用像素快照；
- 不宣称跨 OS 像素完全一致；
- 输出 manifest 记录字体解析结果；
- 字体缺失必须 warning。

---

# 20. Renderer

```ts
export interface VSRRenderJob {
  id: string;
  document: VSRDocument;
  context: VSRContext;
  range: {
    start: number;
    end: number;
    fps: number;
  };
  output: VSRRenderOutput;
  concurrency?: number;
  strict?: boolean;
}
```

```ts
export interface VSRFrameManifestEntry {
  frameIndex: number;
  time: number;
  filename: string;
  byteSize: number;
  contentHash: string;
  semanticHash: string;
}
```

渲染过程：

```text
prepare document once
→ resolve assets once
→ for each frame index:
    calculate exact time
    evaluateAt
    render backend
    encode PNG
    hash
    write atomically
→ write manifest
→ optionally encode video
```

输出文件先写临时文件，再原子 rename。

## 20.1 视频编码

FFmpeg 通过参数数组调用，不使用 shell 拼接。

示例概念：

```ts
spawn("ffmpeg", [
  "-y",
  "-framerate", String(fps),
  "-i", framePattern,
  "-c:v", "libx264",
  "-pix_fmt", "yuv420p",
  outputPath
]);
```

实际实现需处理 Windows 路径、日志、超时和取消。

---

# 21. Agent Protocol

## 21.1 事务

```ts
export interface VSRTransaction {
  transactionId: string;
  baseDocumentHash?: string;
  operations: VSROperation[];
  preconditions?: VSRPrecondition[];
  metadata?: {
    actorId?: string;
    reason?: string;
    createdAt?: string;
  };
}
```

## 21.2 操作

```ts
export type VSROperation =
  | VSRAddNodeOperation
  | VSRRemoveNodeOperation
  | VSRUpdateNodeOperation
  | VSRMoveNodeOperation
  | VSRDuplicateNodeOperation
  | VSRAddTrackOperation
  | VSRUpdateTrackOperation
  | VSRRemoveTrackOperation
  | VSRAddKeyframeOperation
  | VSRUpdateKeyframeOperation
  | VSRRemoveKeyframeOperation
  | VSRSetVariableOperation
  | VSRAddEventOperation
  | VSRRemoveEventOperation
  | VSRSetOutputProfileOperation;
```

`updateNode` 只能更新白名单属性路径。

## 21.3 原子应用

```text
validate transaction schema
→ check base hash
→ check preconditions
→ clone/structurally share working document
→ apply operations
→ validate full document
→ compute diff and inverse
→ commit result
```

任何阶段失败，返回原文档。

## 21.4 Diff

```ts
export interface VSRDocumentDiff {
  added: VSRDiffEntry[];
  removed: VSRDiffEntry[];
  changed: VSRDiffEntry[];
}
```

每项包括 JSON Pointer、before、after、影响节点和语义分类。

## 21.5 Undo/Redo

Undo 应应用 inverse transaction，而不是依赖隐藏内存回滚。历史可序列化。

---

# 22. Runtime Session

```ts
export interface VSRRuntimeSession {
  readonly prepared: VSRPreparedDocument;
  readonly clock: VSRClock;

  evaluate(time?: number): VSREvaluateResult;
  setInput(input: Partial<VSRInputState>): void;
  setRuntimeOverrides(overrides: VSRRuntimeOverrides): void;

  dispatchInteraction(event: VSRInteractionEvent): VSRInteractionResult;
  dispose(): void;
}
```

实时交互只改变 session input/runtime state。需要永久写入文档时必须转成 Agent transaction。

---

# 23. Interaction

```ts
export interface VSRInteraction {
  id: string;
  nodeId: string;
  trigger:
    | "click"
    | "pointerEnter"
    | "pointerLeave"
    | "pointerMove"
    | "keyDown";
  action:
    | { type: "setVariable"; target: string; value: VSRValueSource }
    | { type: "emit"; event: string; payload?: Record<string, VSRValueSource> }
    | { type: "seek"; time: VSRNumberSource };
}
```

命中测试使用 DisplayState hitRegion 和逆矩阵。

---

# 24. RFE Adapter

## 24.1 输入契约

```ts
export interface RFEObserverProjection {
  realityVersion: string;
  logicalTime: number;
  observerId: string;
  visualSemantics: RFEVisualSemantic[];
  deviceProfile?: RFEVisualDeviceProfile;
  omittedInformation?: RFEProjectionOmission[];
  provisional?: boolean;
}
```

```ts
export interface RFEVisualSemantic {
  id: string;
  kind:
    | "entity"
    | "relation"
    | "affordance"
    | "warning"
    | "label"
    | "environment";
  concept: string;
  importance?: number;
  position?: { x: number; y: number; z?: number };
  bounds?: { width: number; height: number; depth?: number };
  state?: Record<string, VSRValue>;
  styleHint?: string;
  provisional?: boolean;
}
```

## 24.2 输出

```ts
export interface VSRRuntimeInput {
  variables: Record<string, VSRValue>;
  events: VSREvent[];
  contextOverrides?: Partial<VSRContext>;
  projectionMetadata: {
    realityVersion: string;
    observerId: string;
    logicalTime: number;
    provisional: boolean;
  };
}
```

## 24.3 规则

- omitted information 不进入变量或日志；
- 适配器不得反查 RFE；
- styleHint 只作为模板选择提示；
- 交互发出 SubjectIntent；
- provisional 使用视觉标记且不得伪装为已提交事实；
- `logicalTime` 映射到 VSR time 的策略可配置；
- RFE reality hash 可进入输出 evidence，但不进入未授权内容。

---

# 25. CLI 技术规范

退出码建议：

| 退出码 | 含义 |
|---:|---|
| 0 | 成功 |
| 1 | 一般失败 |
| 2 | 参数错误 |
| 3 | 文档校验失败 |
| 4 | 资源失败 |
| 5 | 渲染失败 |
| 6 | 编码器不可用 |
| 7 | 事务冲突 |
| 8 | 确定性验证失败 |

`--json` 输出：

```ts
interface VSRCLIResult {
  ok: boolean;
  command: string;
  durationMs: number;
  outputs?: Array<{
    path: string;
    bytes?: number;
    hash?: string;
  }>;
  diagnostics: VSRDiagnostic[];
  data?: unknown;
}
```

---

# 26. Studio 状态架构

建议分为：

```text
document state
runtime session state
selection state
timeline state
history state
render jobs
diagnostics
ui preferences
```

文档修改必须走 `agent-protocol` 的 transaction engine，即使操作来自人类 UI。这样 Studio 与 Agent 共享同一编辑语义。

不可把 React state 当作 Visual IR 的唯一真相。React state 只持有当前文档引用和 UI 状态。

---

# 27. 诊断系统

```ts
export interface VSRDiagnostic {
  code: string;
  severity: "info" | "warning" | "error" | "fatal";
  message: string;
  messageZh?: string;
  path?: string;
  nodeId?: string;
  trackId?: string;
  time?: number;
  suggestion?: string;
  details?: Record<string, VSRValue>;
}
```

代码分类：

```text
SPEC_*
MIGRATION_*
EXPR_*
EVENT_*
TRACK_*
LAYOUT_*
RESOURCE_*
BACKEND_*
RENDER_*
AGENT_*
RFE_*
STUDIO_*
```

用户界面优先展示中文；CLI 默认中文，可通过 locale 切换。

---

# 28. 哈希与规范化

## 28.1 文档语义哈希

不包含：

- `createdAt`；
- `updatedAt`；
- 临时 UI 字段；
- 非语义注释；
- 键顺序。

包含：

- specVersion；
- metadata 中影响运行的字段；
- canvas；
- variables；
- assets 的内容哈希；
- nodes；
- events；
- interactions；
- outputs；
- 语义扩展。

## 28.2 DisplayState 哈希

包含规范化的：

- time；
- viewport；
- background；
- item order；
- transforms；
- resolved appearance/content；
- resource content hash。

浮点数规范化到固定精度，例如 1e-9。精度策略写入 runtime version。

---

# 29. 确定性验证

`vsr verify` 至少执行：

1. 同输入重复求值 10 次；
2. direct seek 与 sequential sample 比较；
3. A→B→A；
4. 不同对象构建顺序但相同规范文档；
5. serialize→parse→evaluate；
6. transaction→undo；
7. Node Null Backend 与浏览器 Null Backend 命令比较；
8. frame manifest 重跑比较。

结果输出：

```ts
interface VSRDeterminismReport {
  ok: boolean;
  documentHash: string;
  runtimeVersion: string;
  checks: VSRDeterminismCheck[];
}
```

---

# 30. 测试策略

## 30.1 单元

每个纯函数独立。

## 30.2 Conformance

使用官方 fixture 验证第三方实现。

## 30.3 Property-based

可使用 fast-check：

- 任意合法关键帧序列；
- 任意事件顺序；
- 任意 seek 顺序；
- transaction/inverse；
- layout 边界。

## 30.4 Visual Regression

- Null command snapshots 为主；
- PNG 为辅；
- 允许明确阈值；
- 字体相关测试固定 CI 环境。

## 30.5 E2E

Playwright 验证 Studio 与下载输出。

---

# 31. 性能设计

## 31.1 Prepared Document

载入时建立：

```ts
export interface VSRPreparedDocument {
  document: Readonly<VSRDocument>;
  documentHash: string;
  nodeById: Map<string, VSRNode>;
  childrenByParent: Map<string | null, string[]>;
  tracksByNode: Map<string, VSRPreparedTrack[]>;
  eventsSorted: VSREvent[];
  assetsById: Map<string, VSRAsset>;
  dependencyGraph: VSRDependencyGraph;
  diagnostics: VSRDiagnostic[];
}
```

## 31.2 增量求值

v0.1 可以先完整求值，但接口应记录：

- changed variables；
- affected nodes；
- dirty layout；
- dirty render items。

后续版本可增量化。

## 31.3 资源缓存

按 contentHash 缓存，避免依赖 URL 作为唯一身份。

---

# 32. 错误处理

- 文档级 fatal：拒绝运行；
- 节点级 error：严格模式拒绝，宽松模式跳过并占位；
- warning：继续但进入输出报告；
- 渲染失败：保留已完成帧和 manifest.partial；
- Studio 自动保存：只保存校验通过的最近版本和草稿版本；
- Agent 事务失败：不改变历史指针。

---

# 33. 可移植性

v0.1 目标：

- Windows；
- macOS；
- Linux；
- Chromium 浏览器。

避免：

- POSIX 专属 shell；
- 硬编码 `/tmp`；
- 路径字符串拼接；
- 假设 FFmpeg 在固定目录；
- 假设系统存在某字体；
- Node 专属 API进入 Core。

---

# 34. 与后续栈的扩展边界

## WebGPU

新增 backend，不改变 Visual IR 核心语义；WebGPU 私有 shader 通过命名空间扩展。

## LAR

VSRDocument 可作为 Living Artifact 的 payload；事务和证据可映射到 LAR 历史，但 v0.1 不把 LAR 作为依赖。

## HNAF/HNAC

VSR Runtime 可由宿主能力描述选择 Canvas、WebGPU、Native 后端；Visual IR 不感知具体宿主。

## RFE

RFE 是现实与观察者投影来源，VSR 是视觉执行器。VSR 交互返回意图，不能越权提交现实。

---

# 35. 最小示例

```json
{
  "specVersion": "0.1",
  "metadata": {
    "id": "hello-vsr",
    "title": "VSR Hello",
    "duration": 5,
    "defaultFps": 30,
    "seed": 42
  },
  "canvas": {
    "width": 1920,
    "height": 1080,
    "layoutMode": "responsive",
    "background": {
      "type": "solid",
      "color": "#08111f"
    }
  },
  "variables": {
    "headline": "画面不是文件，而是计算结果"
  },
  "nodes": [
    {
      "id": "title",
      "type": "text",
      "layout": {
        "x": "50%",
        "y": "50%",
        "width": "80%",
        "anchorX": 0.5,
        "anchorY": 0.5
      },
      "appearance": {
        "opacity": 1,
        "fill": {
          "type": "solid",
          "color": "#e7f0ff"
        }
      },
      "content": {
        "text": {
          "binding": "vars.headline"
        },
        "fontSize": 72,
        "fontWeight": "bold",
        "align": "center",
        "wrap": "word"
      },
      "tracks": [
        {
          "id": "title-opacity",
          "property": "appearance.opacity",
          "mode": "keyframes",
          "keyframes": [
            {
              "id": "k0",
              "time": 0,
              "value": 0,
              "easing": "easeOut"
            },
            {
              "id": "k1",
              "time": 1,
              "value": 1,
              "easing": "easeOut"
            },
            {
              "id": "k2",
              "time": 4,
              "value": 1,
              "easing": "easeIn"
            },
            {
              "id": "k3",
              "time": 5,
              "value": 0,
              "easing": "easeIn"
            }
          ]
        }
      ]
    }
  ],
  "outputs": [
    {
      "id": "landscape",
      "type": "video",
      "width": 1920,
      "height": 1080,
      "fps": 30,
      "codec": "h264"
    },
    {
      "id": "portrait",
      "type": "video",
      "width": 1080,
      "height": 1920,
      "fps": 30,
      "codec": "h264"
    },
    {
      "id": "interactive-web",
      "type": "interactive",
      "responsive": true
    }
  ]
}
```

---

# 36. 实现完成判定

参考实现只有同时满足以下条件才算完成：

```text
Schema 是真实可校验的
Core 是任意时间可求值的
Expression 是沙箱化的
Random 是显式且稳定的
DisplayState 是后端无关的
Canvas 输出是真实文件
视频是从逻辑帧编码的
Agent 事务是原子的
Undo/Redo 可重放
Studio 使用相同事务引擎
RFE Adapter 不越权
测试与基准可复现
```

这套技术边界是为了让 VSR 后续能够从 Canvas 2D 平滑扩展到 WebGPU、Native GPU、XR、LAR 和 HNAC，而不需要推翻 Visual IR 与确定性内核。
