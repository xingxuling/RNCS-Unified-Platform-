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


## Alpha.6：设备投影与权威交互提交

```text
Authoritative DisplayState
→ Observer Projection
→ Device Projection
→ Input Event
→ Interaction Proposal
→ Authority Authorization
→ Optimistic Conflict Check
→ Commit Receipt / Reality Event
```

设备投影只改变宿主几何和输入能力；交互运行时只提出变化，RFE / Reality One 仍保留事实成立与权威提交边界。


## Alpha.7：Shared Reality Coordination Fabric

```text
Local Interaction Commit
→ Shared Commit Candidate
→ Canonical Cursor / Root Check
→ Revocation Check
→ Write-set Conflict Check
→ direct / disjoint-rebase / reject
→ SHA-256 Shared Event Chain
→ HTTP/SSE Broadcast
→ Replica Catch-up / Snapshot Hydration
→ RFE v1.0 Constitutional Commit Bridge
```

共享协调层不重新求值 Visual IR，而是协调已经产生的交互提交。单 Coordinator 维护规范事件链；Replica 只按事件顺序重放。安全证据使用规范化 SHA-256，内部显示缓存仍使用轻量语义哈希。RFE Bridge 绑定 epoch、configuration root、federation root 与 parent certificate，但不替代 C12 federation quorum。
