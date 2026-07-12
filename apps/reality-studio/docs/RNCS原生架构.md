# Reality Studio RNCS 原生架构

## 1. 制造对象

Studio 项目是一个制造描述，不是权威现实本身。它声明：

- 哪些主体存在；
- 主体提出哪些意图；
- 哪些能力能够满足目标；
- 哪些政策允许或拒绝变化；
- 哪个 Living Artifact 承载持续语义；
- 哪些事实、关系和事件需要建立；
- 哪些候选分支需要比较；
- 哪些观察者通过何种设备看到什么；
- 变化需要哪些证据。

## 2. 编译产物

```text
Studio Project
├─ LAF Artifact
├─ Provider Manifests
├─ CNP Negotiation Request
├─ AAF Policy Bundle
└─ Gateway Pipeline Input
```

编译产物有独立根，可检查是否与源项目一致。

## 3. 执行边界

- Studio：制造与编译。
- CNP：发现和选择能力。
- ICAR：形成预览和执行计划。
- AAF：裁决是否有权执行。
- RFE：提交唯一 Generation。
- LAF：保存工件修订并绑定 Generation。
- Gateway：动态发现与调用。

## 4. 连续性边界

```text
Studio Project Revision ≠ RFE Generation
LAF Revision ≠ RFE Generation
HNAC Snapshot ≠ RFE Generation
ICAR Session ≠ RFE Generation
```

只有 RFE Commit 可以表示权威现实发生变化。

## 5. 体验模块

Experience Projection 可以承载：

- 二维场景；
- 三维场景；
- 音频体验；
- 仪表盘；
- XR 世界；
- 机器人观察界面。

体验模块读取现实切片，不拥有上位现实。
