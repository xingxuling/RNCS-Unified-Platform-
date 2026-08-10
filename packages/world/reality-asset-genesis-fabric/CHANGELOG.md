# Changelog

## v0.7.0-alpha.1

- Anime motion contract 增加显式 cycle coverage：`loop_mode`、`loop_period_frames`、`loop_period_seconds` 与 `coverage_policy`
- Provider Manifest 声明 loopable-motion-sequence；运行时默认使用 `loop`，legacy 轨道仍可显式使用 `hold-last`
- RAGF/RNCS 绑定证据记录每个 Cut 的周期覆盖率、可达源帧数和 loop iterations
- Anime Character Family Provider 升级至 v0.4，输出确定性的多帧 PNG 角色动作序列与 `motion-track.json`
- 将头发、衣物、呼吸和眨眼绑定到逐帧状态，保留 identity、palette、proportion 和 appearance 根连续
- 新增 motion sequence、frame roots、temporal variation 和 motion track 验证门
- Provider Manifest 声明 `image/png-sequence`、`application/json` 与 secondary-motion-track 能力
- Evidence Ledger 可复现 idle/resolve 多帧媒体、运动轨道和 SHA-256 清单

## v0.6.0-alpha.1

- 升级内置 Anime Character Family Provider 至 v0.3
- 同一 Character Genome 生成具备身份、比例、面部、发型、服装和状态绑定的角色 SVG 与真实 PNG 媒体
- 新增 state root、render contract、PNG media manifest 和非占位媒体质量门
- 表情、口型、眨眼、视线与姿势状态进入可见角色画面，并保持跨状态身份、配色和比例根连续
- Anime Provider Manifest 声明 image/png 输出与 state-driven raster 能力
- 修正 stdio 外部 Provider 测试对当前工作目录的隐式依赖

## v0.4.0-alpha.1

- 新增AssetProductionSession与生产会话HTTP API
- 新增十类生产就绪门、候选选择和选择回执
- 新增定点再生成历史、接受回执与生产清单
- 修复非推荐候选仍沿用推荐候选连续性的问题
- 新增production-demo CLI
- 自动测试扩展至146项


## v0.3.0-alpha.1

- RAGF从单资产生成器升级为资产家族编译器
- 新增Asset Family与Lineage Graph
- 新增Prefab Blueprint，统一装配视觉、动画、物理、音频、特效与投影
- 新增Humanoid-lite Animation Retarget Profile
- 新增Cross-media Projection Manifest
- 新增Dependency Graph与语义修改影响范围
- 新增增量再生成计划、稳定Asset ID保持和Regeneration Receipt
- 证明配色修改可保持主Mesh内容根不变
- Reality Studio导入升级至v1.4资产家族操作
- 自动测试扩展至133项

## v0.2.0-alpha.1

- 新增 glTF 2.0 Binary / GLB 编码、检查与文件输出
- 新增低多边形三维角色、蒙皮、Humanoid-lite 骨骼和攻击动画
- 新增 Base Color、Normal、ORM、Emissive PBR 材质包
- 新增 LOD0、LOD1、LOD2 与确定性 LOD Manifest
- 新增动画语义包、武器 Socket 与 VFX Socket
- 新增 VSR v0.4 空间资产和 RSR v0.5 具身配置适配
- 新增 Reality Studio v1.3 资产记录输出
- Provider Manifest 升级至 v0.2，增加 asset kind、确定性与来源许可声明
- 候选验收新增 production 维度
- 连续性 Bundle 新增 Provider 来源、许可证、LOD和三维角色文件
- CLI 新增 inspect、providers、verify --files
- Web Workbench 增加二维/三维选择和三维结果摘要
- 自动测试扩展至 105 项

## v0.1.0-alpha.1

- 建立现实资产意图、基因组、生成计划和候选协议
- 建立 Provider Manifest、能力协商和 stdio 外部生成接口
- 新增确定性 SVG、PNG、WAV、粒子与碰撞生成器
- 新增多候选分支、自动验收与比较
- 新增资产持续包、RFE 因果增量、AAF 权威请求与 Studio 导入提案
- 新增离线工作台、CLI、测试、基准与发布审计

## 0.5.0-alpha.1

- Added deterministic society genesis without LLM calls.
- Added social ecology, historical ledger and player intervention branches.
- Added combinatorial technology concept grammar and seven-phase engineering pathways.
- Added structured player technology proposal compiler.
- Added 2.5D projection and runtime integration contracts.
