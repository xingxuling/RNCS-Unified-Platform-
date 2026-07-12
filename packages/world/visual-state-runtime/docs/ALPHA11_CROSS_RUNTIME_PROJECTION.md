# Alpha.11 跨运行时双向投影

## 1. 命名边界反演

传统“适配器”通常意味着一次性格式转换。Alpha.11 将其反演为跨运行时承诺：转换结果必须绑定源项目、活动场景、组件合同、显示状态和目标补丁，且能检测源现实已经变化。

```text
Source Runtime State
→ Normalized Meaning
→ VSR Projection
→ User / Agent Edit
→ Verified Patch
→ Source Runtime Authority Boundary
```

## 2. Reality Studio v0.3

适配器选择活动场景，把对象转换为 VSR 节点，并把 tick 组件合同编译成表达式轨道。桥接根绑定 Project Root、Scene Root、Component Contract Hash、Document Root、Display Hash 和 Hybrid Plan Hash。

## 3. 回写补丁

补丁只描述从原始 Studio 对象到编辑后 VSR 对象的可映射变化。应用前必须重新计算基础项目根和场景根；任一不一致都会被视为 stale，不允许覆盖新项目状态。

## 4. Reality One v0.2

六域统一适配器保留 HNAC、模拟、视觉投影、Living Artifact、Reality Studio 和 RFE 的独立根，并生成统一 Projection Root。VSR 负责相对观察者与设备的显示，不替代六个域自己的证据验证。

## 5. GPU 语义边界

轴对齐矩形 Clip 转换为 Scissor；零模糊阴影扩展为额外图元；加法混合进入独立 Pipeline。软阴影、复杂 Clip 和未知 Blend Mode 继续回退，确保加速不改变视觉意义。
