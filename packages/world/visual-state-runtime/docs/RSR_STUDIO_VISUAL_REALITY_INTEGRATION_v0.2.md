# RSR / Reality Studio 与 Visual Reality Compiler 集成

## RSR

RSR v0.4 的动画、粒子和体验事件先生成确定性的 VSR DisplayState。Visual Reality Compiler 不重新模拟动画或粒子，只处理该 Tick 的可见性、材质、光照、批次和设备预算。

```text
RSR Experience Tick
→ VSR DisplayState
→ Observer / Device Projection
→ Visual Reality Plan
→ WebGPU / Hybrid / CPU Reference
```

`particle` 和 `decorative` 标签允许低端设备降低粒子密度；角色、字幕、任务对象等语义节点不得被 LOD 静默删除。

## Reality Studio

Studio 可以编辑：

- 材质库与绑定；
- 灯光；
- 质量档位；
- 后处理；
- 观察者目的；
- 设备预算；
- Render Graph 调试视图。

Studio 保存的是语义配置，不保存某一张最终截图。相同项目可编译为手机、桌面、XR 和审计视图。
