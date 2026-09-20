# RNCS Human Embodiment Runtime v0.4.0-alpha.1

## 本版定位

v0.4 专门修正 v0.2/v0.3 的一个根本问题：旧版 `canonical-human` 只有 19 个关键点，更接近“动画火柴骨架 / IK 测试骨架”，不足以作为武术训练与专业人体运动分析的长期母体。

v0.4 新增 **Professional Anatomical Rig（专业解剖运动骨架）**，并保留旧骨架作为兼容层。

### 核心变化

- 38+ 解剖/运动学节点，而非 19 点简化人形。
- 脊柱分为 L5 / L3 / L1 / T12 / T8 / T4 / C7 / C3，而不是 `pelvis → spine → chest → neck` 四段。
- 肩带拆分为 SC（胸锁）、AC（肩锁）、scapula（肩胛）与 GH（盂肱）层。
- 前臂加入 radioulnar（桡尺旋转）层，不再把前臂视作单铰链。
- 足部加入 ankle / subtalar / MTP / heel / hallux，不再只有一个 `foot` 点。
- 独立 Anatomical Landmarks（解剖标志点）：ASIS / PSIS / acromion / epicondyles / malleoli / heel / MTP 等。
- 独立 Segment Frames（节段坐标系）与 Joint Coordinate System 元数据。
- 专业骨架采用右手系：**+X 前、+Y 上、+Z 身体右侧**；渲染坐标通过 Adapter 转换。
- COM 改为 segment-based（基于身体节段）估计，而不是给若干关节点直接加权。

## 为什么这样改

旧骨架能验证 Motion IR、FK/IK、脚底锁定这些“运行时链路是否能工作”，但不应该继续承担“专业人体模型”的职责。

真正要用于万风拳/步法跟练，需要把以下层级分开：

1. **Anatomical Model**：人体有哪些节段、关节中心、标志点与局部坐标系。
2. **Kinematic Rig**：这些节段如何通过 FK / IK / Retargeting 运动。
3. **Biomechanics Layer**：COM、支撑面、接触、节段质量/惯量。
4. **Training Semantics**：中轴、归轴、步位、拳路、动力链。
5. **Renderer**：VSR / Babylon / Three.js 只是把结果显示出来。

## 标准边界

本版以 ISB（International Society of Biomechanics）公开的 Joint Coordinate System 思想作为坐标和分段设计参考，但它仍是 **simulation / training runtime**，不是临床诊断、医学测量或替代 OpenSim 等完整肌骨模型。

ISB 参考：
- Wu et al. 2002: ankle / hip / spine JCS
- Wu et al. 2005: shoulder / elbow / wrist / hand JCS

## v0.4 新文件

- `src/anatomical-skeleton-v4.mjs`
- `src/anatomical-coordinates-v4.mjs`
- `src/joint-coordinate-systems-v4.mjs`
- `src/biomechanical-segments-v4.mjs`
- `src/human-runtime-v4.mjs`
- `tests/human-embodiment-v4.test.mjs`

## 当前验证

- 全套测试：25 passed / 0 failed
- RCL Contract：`HumanEmbodimentV04AnatomicalContract`
- RBC SHA-256：`cf6b1abe3c89bf0786fc73835c32999fa26be2e7b60360b245624e942ec8a970`

## 下一步

v0.4 解决的是“骨架不够专业”。下一步应把 v0.3 的 Full-Body IK / Foot Plant / Mocap / Retargeting 全面迁移到专业骨架，并进一步加入：

- scapulohumeral rhythm（肩胛-肱骨节律）
- knee coupled motion 的可选模型
- foot arch / COP / pressure contacts
- segment inertia tensors
- marker calibration
- individual anthropometry calibration
- OpenSim / C3D / TRC 桥接
