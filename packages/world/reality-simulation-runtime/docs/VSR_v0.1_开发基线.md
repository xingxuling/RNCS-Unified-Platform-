# Visual State Runtime（VSR）v0.1.0 开发文档

**文档性质：** 产品开发基线 / 版本计划 / 验收规范  
**目标版本：** v0.1.0  
**版本代号：** Minimum Executable Visual Runtime  
**默认用户界面：** 简体中文  
**核心实现：** TypeScript + Canvas 2D + Node Renderer + React Studio  
**长期方向：** WebGPU、原生 GPU、XR、RFE 视觉投影层

---

# 1. 开发目标

VSR v0.1.0 的目标不是做一个视频模板工具，而是证明以下命题：

> 一个视觉作品可以脱离具体作者框架和具体输出格式，以结构化 Visual IR 作为可执行本体，在任意逻辑时间被确定性求值，并投影到实时屏幕、图片、视频和交互界面。

首版必须形成最小但完整的工程闭环：

```text
结构化视觉文档
→ 校验与迁移
→ 任意时间求值
→ 后端无关 DisplayState
→ Canvas/Null 输出
→ 图片与视频派生
→ Agent 事务编辑
→ 可视化 Studio
→ RFE 观察者投影适配
```

---

# 2. 用户与使用场景

## 2.1 核心用户

### AI 编程与内容 Agent

需要通过结构化命令创建、修改、预览、验证和导出视觉作品，而不是反复重写大量 React/HTML/CSS 字符串。

### 开发者

需要把视觉文档嵌入网页、桌面应用、移动端、直播工具、游戏 UI、产品演示或 RFE 投影系统。

### 视觉设计与内容生产者

需要使用 Studio 编辑场景、属性和时间轴，并从同一源文档输出横屏、竖屏、方屏、图片和视频。

### RFE / 现实原生计算栈开发者

需要把已经经过主体权限、知识与设备过滤的 Observer Projection 转换成视觉体验。

---

# 3. 产品边界

## 3.1 v0.1 必须解决

- Visual IR 的规范化表示；
- 任意时间直接求值；
- 确定性随机、表达式和动画；
- 事件归约；
- 响应式基础布局；
- 后端无关 DisplayState；
- Canvas 2D 与 Null 后端；
- PNG、序列、可选视频；
- Agent 原子事务；
- undo/redo；
- CLI；
- 中文 Studio；
- RFE Adapter；
- 自动测试和性能基线。

## 3.2 v0.1 不负责

- 完整专业剪辑工作流；
- 电影级 3D；
- PBR、阴影和全局光照；
- 完整粒子模拟器；
- 音频工作站；
- 文生视频模型；
- 多人协作云服务；
- 原生桌面安装包；
- XR 输出；
- 神经接口输出；
- 完整 LAR/HNAC 封装。

这些能力可在后续版本扩展，但首版架构不得阻断它们。

---

# 4. 成功标准

VSR v0.1.0 成功不以“页面能打开”为标准，而以以下证据为标准：

1. 同一文档、时间、上下文与种子重复求值，语义哈希一致；
2. 直接 seek 到 5 秒与从 0 播放到 5 秒结果一致；
3. 同一 Visual IR 可在浏览器预览和 Node 离线渲染；
4. 可生成真实 PNG 和图片序列；
5. FFmpeg 存在时可生成真实 MP4 或 WebM；
6. Agent 可原子修改节点和关键帧；
7. Agent 修改可撤销、重做和审计；
8. Studio 的主要按钮全部可操作；
9. RFE 示例可从观察者投影生成视觉状态；
10. 自动测试与 E2E 全部通过。

---

# 5. 版本范围

## 5.1 Visual IR

首版节点：

| 节点 | 必须能力 |
|---|---|
| group | 子节点、transform、opacity、clip |
| rect | 尺寸、圆角、填充、描边 |
| ellipse | 尺寸、填充、描边 |
| line | 起终点、线宽、虚线 |
| path | SVG path 子集、填充、描边 |
| text | 内容、字体、换行、对齐 |
| image | 资源引用、fit、crop、opacity |

首版轨道：

| 轨道模式 | 状态 |
|---|---|
| keyframes | 完整实现 |
| expression | 完整实现 |
| binding | 完整实现 |
| simulation | 只定义扩展接口，明确不支持 |

首版输出：

| 输出 | 状态 |
|---|---|
| 浏览器实时 Canvas | 必须 |
| Node PNG | 必须 |
| PNG 序列 | 必须 |
| MP4/WebM | FFmpeg 存在时必须 |
| Web Bundle | 必须提供 demo bundle |
| SVG/DOM/WebGPU | 后续版本 |

---

# 6. 开发原则

## 6.1 大架构、小闭环

仓库从一开始按 Spec、Core、Backend、Renderer、Agent、Adapter、Studio 分层，但每一层只实现首版真正需要的能力。

## 6.2 Core 纯净

Core 不依赖：

- React；
- 浏览器 DOM；
- Node Canvas；
- FFmpeg；
- Studio 状态管理；
- RFE 实现细节。

Core 只依赖规范类型、表达式、布局和纯函数工具。

## 6.3 显式失败

不支持的节点、属性、轨道或后端能力必须返回诊断，不能静默忽略。

## 6.4 可复现优先

逻辑时间、显式种子、稳定排序、规范化哈希和无隐藏状态优先于“动画看起来能动”。

## 6.5 UI 不得制造假能力

未实现的 Studio 功能必须隐藏或禁用并展示原因。所有可见主要按钮必须工作。

---

# 7. 工作包

## WP0：工程基线

### 任务

- 初始化 pnpm workspace；
- 配置 TypeScript strict；
- 配置 lint、format、Vitest、Playwright；
- 建立统一 build 和 test 命令；
- 建立版本和包发布策略；
- 添加 Apache-2.0 核心许可证建议；
- 添加 CI。

### 验收

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

在空业务阶段可通过，且新增包会自动纳入。

---

## WP1：VSR Spec 与 Schema

### 任务

- 定义 `VSRDocument`；
- 定义节点、轨道、事件、交互、资源、输出；
- 生成 JSON Schema 2020-12；
- Ajv 校验；
- 诊断路径与中文错误映射；
- 规范化序列化；
- 文档语义哈希；
- 版本迁移注册器；
- v0.1 fixture。

### 验收

- 正确文档通过；
- 缺失 ID、重复 ID、循环父子关系失败；
- 未知核心字段按策略报警；
- 扩展字段只允许命名空间；
- 同语义不同键顺序哈希相同；
- v0.0 fixture 可迁移到 v0.1。

---

## WP2：表达式与确定性数学

### 任务

- tokenizer；
- parser；
- AST；
- 类型检查；
- 依赖提取；
- 求值预算；
- 白名单函数；
- seeded PRNG；
- noise；
- 颜色解析和插值；
- easing；
- deterministic spring。

### 验收

- 禁止任意对象访问；
- 原型链攻击用例失败；
- 相同 seed 输出一致；
- AST 深度和执行预算生效；
- 变量依赖可列出；
- 错误包含表达式位置和修复建议。

---

## WP3：逻辑时间、状态与动画

### 任务

- `VSRClock`；
- `evaluateAt`；
- initial state；
- event reducer；
- binding；
- expression track；
- keyframe track；
- 属性优先级；
- runtime override；
- active/visible；
- snapshot 扩展接口。

### 验收

- seek 等价；
- 反复 seek 无副作用；
- 边界时间行为固定；
- 同时间重复关键帧有明确规则；
- 失败事件不污染状态；
- 帧索引和时间转换无累计误差。

---

## WP4：布局、变换与 DisplayState

### 任务

- fixed/responsive canvas；
- px、百分比、vw、vh；
- anchor；
- safe area；
- min/max size；
- aspect fit/fill；
- 文本测量接口；
- local/world transform；
- clip；
- 稳定 z-order；
- flatten display list；
- bounds；
- hit region。

### 验收

- 横、竖、方三种画布；
- 嵌套 transform 正确；
- 父透明度和显隐传播；
- 不同创建顺序遵守稳定排序规则；
- bounds 可用于 Studio 选中；
- Null Backend 输出稳定。

---

## WP5：渲染后端

### Null Backend

- 输出标准绘制命令；
- 可序列化；
- 可生成语义哈希；
- 支持调试和快照测试。

### Canvas Backend

- 浏览器 Canvas；
- Node Canvas；
- text/image/path；
- transform/clip/alpha/shadow；
- gradient；
- capture；
- capability report。

### 验收

- 同一 DisplayState 可提交两个 Canvas 实现；
- PNG 非空且尺寸正确；
- 缺失图片资源返回明确错误；
- 后端不支持能力时按策略降级或失败；
- dispose 后资源释放。

---

## WP6：Renderer 与输出

### 任务

- render frame；
- render range；
- manifest；
- frame hash；
- progress；
- cancel；
- concurrency；
- FFmpeg detection；
- MP4/WebM encoder adapter；
- 临时目录清理；
- 输出报告。

### 验收

- 指定时间 PNG；
- 0–5 秒 30fps 生成 150 帧；
- manifest 记录时间、尺寸、哈希；
- 中断任务可取消；
- FFmpeg 缺失不误报视频成功；
- 编码失败保留帧并报告命令和 stderr 摘要。

---

## WP7：Agent Protocol

### 任务

- operation schema；
- transaction schema；
- precondition；
- atomic apply；
- document diff；
- inverse transaction；
- undo/redo stack；
- validate；
- preview；
- render range tool；
- audit log。

### 验收

- 批量事务原子性；
- 无效节点路径失败；
- 删除父节点时对子节点策略明确；
- undo 恢复语义哈希；
- redo 恢复修改；
- 事务日志可序列化；
- precondition 防止覆盖并发变化。

---

## WP8：CLI

### 任务

实现：

- validate；
- inspect；
- eval；
- render-frame；
- render-range；
- encode；
- patch；
- verify；
- serve；
- benchmark。

### 验收

- 命令帮助完整；
- `--json` 输出稳定；
- 错误退出码可区分；
- 输出路径真实存在；
- Windows、macOS、Linux 路径安全；
- CLI 测试覆盖。

---

## WP9：RFE Adapter

### 任务

- 定义轻量 ObserverProjection 契约；
- projection→variables；
- projection→semantic visual nodes；
- device profile→VSR context；
- provisional 标记；
- interaction→subject intent；
- 门/钥匙/房间 fixture；
- 适配器测试。

### 验收

- 不读取未授权字段；
- 不修改 RFE 状态；
- realityVersion 和 observerId 可追踪；
- 同一投影确定性转换；
- 不同设备上下文生成不同布局但保留语义；
- provisional 状态可视化。

---

## WP10：VSR Studio

### 页面结构

```text
顶部：文件、编辑、播放、输出、验证
左侧：场景树 / 资源
中央：画布 / 缩放 / 安全区
右侧：属性 / 轨道 / 诊断
底部：时间轴 / 关键帧 / 播放头
侧栏或抽屉：JSON / Agent 事务 / Diff / 输出任务
```

### 必须功能

- 新建、打开、保存；
- 示例切换；
- 场景树增删改；
- 属性编辑；
- 画布选中；
- 播放、暂停、停止、seek、逐帧；
- 关键帧增删改；
- undo/redo；
- 校验；
- JSON 编辑和同步；
- Agent 事务；
- PNG 导出；
- 区间渲染；
- 输出进度；
- 中文错误。

### 验收

Playwright 自动完成一套完整操作并验证导出文件。

---

## WP11：示例、文档、基准和发布

### 示例

- 标题 Motion；
- 数据面板；
- 交互卡片；
- RFE 门投影；
- 确定性点阵；
- 多画幅响应式。

### 文档

- 架构；
- Visual IR；
- 确定性；
- 表达式；
- 后端；
- Agent；
- RFE Adapter；
- CLI；
- Studio；
- 故障排查。

### 发布

- changelog；
- 版本号；
- license；
- npm package metadata；
- source map；
- release archive；
- 验收报告。

---

# 8. 迭代计划

## Phase A：语义内核

包含 WP0–WP3。

完成条件：不渲染像素，也能对 Visual IR 在任意时间输出稳定状态。

## Phase B：视觉闭环

包含 WP4–WP6。

完成条件：浏览器与 Node 可真实渲染图片、序列和视频。

## Phase C：Agent 与工具链

包含 WP7–WP9。

完成条件：Agent、CLI 与 RFE 可调用。

## Phase D：人类编辑与发布

包含 WP10–WP11。

完成条件：Studio 可用、E2E 通过、文档与基准齐全。

ZCode 应在一次开发任务中按顺序完成四个阶段，而不是每个阶段都等待用户再次下令。

---

# 9. 缺陷等级

| 等级 | 定义 | 示例 |
|---|---|---|
| P0 | 破坏数据或核心不变量 | seek 不确定、事务部分提交 |
| P1 | 主闭环不可用 | 无法导出 PNG、Studio 无法加载 |
| P2 | 核心功能有降级 | 某合法布局错误 |
| P3 | 体验问题 | 错误信息不清楚、快捷键缺失 |
| P4 | 后续增强 | 新后端、新节点 |

v0.1 发布不得存在 P0/P1；已知 P2 必须明确记录且不得影响示例闭环。

---

# 10. 测试矩阵

| 维度 | 组合 |
|---|---|
| 时间 | 0、边界、关键帧、结束、越界 |
| 帧率 | 1、24、30、60 |
| 画幅 | 16:9、9:16、1:1 |
| DPR | 1、2 |
| Seed | 相同、不同 |
| Backend | Null、Browser Canvas、Node Canvas |
| 文档 | 合法、可迁移、非法、扩展 |
| 事务 | 成功、前置失败、部分操作失败、undo/redo |
| 资源 | 正常、缺失、损坏 |
| RFE | 权限完整、字段省略、provisional |

---

# 11. 性能预算

首版不追求极限，但需要避免明显架构死路：

- `evaluateAt` 尽量只处理受时间、变量和事件影响的节点；
- 文档载入时建立节点和轨道索引；
- 事件按时间排序；
- 路径和图片资源缓存；
- Studio 使用 requestAnimationFrame，但求值以逻辑时间为准；
- 离线渲染使用有界并发；
- 诊断保留路径，不保存巨大对象副本；
- undo/redo 使用事务与结构共享，避免每次深拷贝整个大型文档。

基准只报告真实数据，不设置虚构 SLA。

---

# 12. 安全要求

- 表达式无任意代码执行；
- 资源 URL 默认禁止任意网络访问，需显式策略；
- 路径必须防目录穿越；
- FFmpeg 参数不得由未转义字符串拼接；
- Studio 导入限制文件大小；
- 图片解码限制像素；
- Agent 事务限制操作数和文档增长；
- 诊断不得泄露系统敏感路径；
- RFE 适配器不得泄露 omitted information；
- 输出内容安全策略由宿主配置，Core 不主动联网。

---

# 13. 发布验收清单

## 构建

- [ ] install 成功
- [ ] lint 成功
- [ ] typecheck 成功
- [ ] unit tests 成功
- [ ] conformance tests 成功
- [ ] rendering tests 成功
- [ ] E2E 成功
- [ ] build 成功

## 核心语义

- [ ] 任意时间求值
- [ ] seek 等价
- [ ] 稳定哈希
- [ ] seeded random
- [ ] event reducer
- [ ] keyframe
- [ ] expression
- [ ] responsive layout
- [ ] capability negotiation

## 输出

- [ ] 浏览器预览
- [ ] Node PNG
- [ ] PNG 序列
- [ ] manifest
- [ ] FFmpeg 视频或明确缺失报告

## Agent

- [ ] 原子事务
- [ ] diff
- [ ] inverse
- [ ] undo/redo
- [ ] preview
- [ ] audit

## Studio

- [ ] 主要按钮工作
- [ ] 中文 UI
- [ ] 文件打开保存
- [ ] 时间轴
- [ ] 属性编辑
- [ ] 关键帧
- [ ] 导出
- [ ] Agent 面板

## 集成

- [ ] RFE fixture
- [ ] ObserverProjection 映射
- [ ] provisional
- [ ] interaction intent
- [ ] 不反向修改现实

---

# 14. 后续版本路线

## v0.2：高级 2D 与多后端

- SVG；
- DOM/CSS；
- mask；
- filter；
- advanced text；
- vector morph；
- audio timeline；
- Remotion/HyperFrames adapter；
- LAR 包装；
- HNAC host profile。

## v0.3：WebGPU 视觉运行时

- render graph；
- WGSL shader；
- GPU particles；
- texture pipeline；
- compute；
- 2.5D；
- 高性能实例化。

## v0.4：3D 与 XR 基础

- camera；
- mesh；
- material；
- depth；
- lighting；
- XR；
- RFE 3D projection。

## v0.5：协作与云渲染

- 文档分支；
- transaction merge；
- 权限；
- remote renderer；
- distributed jobs；
- evidence bundle。

---

# 15. 最终锚点

VSR v0.1 不是“又一个 Canvas 动画库”。

它必须证明：

```text
同一视觉语义
可以被确定性求值
可以被多设备重新布局
可以被 Agent 结构化修改
可以被人类编辑
可以派生为屏幕、图片和视频
可以作为 RFE 的视觉投影执行层
```

只有这个闭环成立，VSR 才从架构定义进入真实工程阶段。
