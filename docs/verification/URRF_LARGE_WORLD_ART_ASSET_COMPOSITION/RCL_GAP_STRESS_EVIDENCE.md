# URRF Large-World Art-Asset Composition

状态：`CANDIDATE_ONLY`。本文是本候选工作树的证据账本，不是 K400 `PASS`、RCL 晋升、生产发布或专业美术质量声明。

## 语义所有权

- RNCS：拥有世界真值、代际、权威提交和持久化写入；本候选没有获得这些权限。
- URRF：拥有表示候选的配方、表示轴、组合根和表示候选选择。
- VSR：将已验证的候选下沉为空间场景、CPU 参考帧和 GLB 表示。
- RAGF / large-world visual prototypes：作为可复用的几何与材质生成借用者；不能写入 RNCS 权威世界状态。

## RCL Gap（明确记录，不静默绕过）

当前 RCL 仍没有被本候选证明能够直接表达并执行“可复用几何原型 + 材质/生物群系/风格轴 + 多部件变换 + 质量档位 + 表示下沉”的通用视觉资产组合语义。

本轮 workaround 是在 RNCS downstream 的 URRF large-world runtime 中建立候选接口：

`recipe -> normalized axes -> composition_root -> URRF/VSR fragment -> spatial scene/GLB`

这不是把 JavaScript/VSR 冒充 RCL-native 完成。候选吸收条件仍待单独的 RCL primitive/IR/runtime profile 设计、回归集和 Integration Court 裁决；在裁决前不改变 RCL Core 的 canonical owner。

## Stress Case

本轮固定压力样本包含：

- 5 个可复用资产配方、9 个部件；
- 8 个几何轴：`grove`、`ruin`、`shrine`、`watchtower`、`crystal`、`iron`、`salt`、`water`；
- 4 个风格轴：`natural`、`ancient`、`industrial`、`arcane`；
- 5 个风格/生物群系材料组合，包含单部件与结构/资源混合多部件资产；
- `STANDARD`、`CINEMATIC`、`MOBILE` 三种质量档位；
- 显式毫米级平移、缩放、旋转，资产根、组合根和场景根均可重算；
- 两个同几何不同风格/生物群系的资产用于验证材料变化；公共场景 API 还验证共享原型几何去重。

## 九道 Gate 的当前证据

| Gate | 当前状态 | 证据边界 |
| --- | --- | --- |
| EXPRESS | `EVIDENCED` | 配方、部件、几何/材质/风格/质量/组合轴可归一化并进入 schema。 |
| COMPILE | `EVIDENCED` | `@taowind/large-world-runtime` focused suite：39/39。 |
| LOWER | `EVIDENCED` | 9 个部件下沉到 VSR fragment；场景根和 GLB manifest 可验证。 |
| EXECUTE | `EVIDENCED_CANDIDATE` | 本机 CPU VSR 参考渲染成功，并由真实 Chromium WebGPU 提交同一场景；浏览器 receipt 校验通过，目标设备未执行。 |
| CORRECT | `CANDIDATE` | root 重算、篡改组合、超部件数、未知 placement 的负例已覆盖；美术语义正确性未证明。 |
| ROBUST | `CANDIDATE` | 部件、向量、质量、半径和 placement 边界有校验；尚未做 fuzz、长时流式和压力负载。 |
| PERFORMANCE | `NOT_RUN` | 没有把 3 秒级本地参考渲染当成性能结论；未建立基准门槛。 |
| AI_GENERATE | `NOT_PROVEN` | 本轮没有声称由模型生成专业/高分辨率/AAA 资产。 |
| EVIDENCE | `CANDIDATE` | 报告根、场景 JSON、GLB manifest、9 个 LOD0 GLB、CPU PNG、browser receipt 与 Playwright 截图已落盘；没有 CI、目标硬件或发布证据。 |

## 本轮回归与产物

集成报告 `large-world-art-asset-composition-report.json` 的根为：

`ea496325482b420c7ff21e211362a1907e79ac07450ff13acaf6f9acdd602814`

其中场景根为 `f8cb34fd8b6a18d981716e0e6d1a0e9ed351e65941670205ef3a6d8cf8014015`，CPU frame root 为 `6545ffb6d4fc49eb4ba30e65fb780ccdb744e9aa74ee9688c51fb99cea74dbc6`，像素根为 `6e665855e4fa5945ba7960e3c5b143a673881b67601c53a03982d54653bdb16c`。

已执行：

1. `npm test --workspace @taowind/large-world-runtime`：39/39 通过。
2. `node --test tests/large-world-art-asset-composition.integration.test.mjs`：1/1 通过。
3. JSON schema 解析检查：通过。
4. `git diff --check`：通过；仅有现存换行符提示，没有 whitespace error。
5. 真实 Chromium WebGPU：receipt 校验通过，`submitted=true`、`deviceLost=false`、9 draws/488 triangles；控制台无页面错误，仅有 Windows Chromium 对 `powerPreference` 的已知 warning。

## K400 映射边界

本轮只记录已施压的通用维度：representation/geometry、representation/material、style/biome、quality/lowering、multi-part transform、deterministic evidence。没有根据这批本地结果自行宣布 K400 20×20 矩阵通过；正式 cell 编号、跨项目 holdout 和晋升仍需后续 Integration Court。

## 下一最高杠杆缺口

下一步应增加目标设备性能/长时流式证据，并接入一个外部/高分辨率资产 provider 的 provenance 与失败闭环；这些完成前，结论仍是“可组合、可下沉、可在本机 CPU 与 Chromium WebGPU 执行的低多边形候选”，不是“能自动生成任意专业美术资产”。
