# VSR 架构

```text
Visual IR / RFE Projection / Agent Transaction
                    ↓
Spec Validator → Canonical Hash → Prepared Document
                    ↓
Logical Time → Event Reducer → Binding / Expression / Keyframe
                    ↓
Responsive Layout → Matrix → Visibility → Stable Display List
                    ↓
                 DisplayState
        ┌───────────┼────────────┐
        ↓           ↓            ↓
      Null       Browser       Node Raster
                                 ↓
                           PNG / Frames / FFmpeg
```

核心依赖只向下：Spec → Expression/Layout → Core → Backend/Renderer/Agent/Adapter → CLI/Studio。

Core 不导入 Node 文件系统、FFmpeg、DOM 或 Studio。

## Alpha.5：Observer Projection Fabric

观察者相对投影位于权威 DisplayState 与具体后端之间：

```text
Core Evaluate
→ Authoritative DisplayState
→ Prepared Observer Projection Plan
→ Observer Decision Plan
→ show / redact / hide
→ Observer DisplayState
→ Canvas / PNG / Video / XR
```

该层不修改权威状态，也不重新求值 Visual IR。策略与父子边界在 `prepareObserverProjection()` 中预编译，观察者决策按 Observer Hash 缓存。多视图通过源文档哈希、源显示哈希和 Reality Invariant 哈希保持等价。
