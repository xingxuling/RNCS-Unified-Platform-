# RNCS＋Aetherworld Unified v0.10.0-alpha.1 开发验收报告

## 1. 发布裁决

本版名称：**Asset Production & Studio Forge Runtime**。

- Mother Project：`0.10.0-alpha.1`
- RAGF：`0.4.0-alpha.1`
- Reality Studio：`1.5.0-alpha.1`
- RSR：`0.9.0-alpha.1`
- VSR：`0.8.0-alpha.1`
- Reality Network Runtime：`0.2.0-alpha.1`（权威状态协议未变化）
- GitHub基线：`main-95@a340a2839786f0409616645fe0aa5cd612e9892c`
- GitHub审查分支：`rncs-v010`
- GitHub参考提交：`b13acb7f751b325e0ab9193684c9fd743e0b43da`
- Pull Request：`#6`

## 2. 代码考古与最小修改面

RAGF v0.3已经可以生成GLB、PBR贴图、骨架、动画、LOD、碰撞、Prefab、家族、Lineage和连续性包；Reality Studio v1.4已经具备资产导入、场景编辑及RSR/VSR空间编辑。因此本版没有重复增加“生成/导入”名义功能，而是补齐：

```text
资产意图
→ 三候选生产
→ 十类就绪度审查
→ 候选选择
→ 定点再生
→ 连续性接受
→ Studio场景实例
→ RSR身体/角色绑定
→ VSR投影与证据根
```

## 3. RAGF v0.4真实新增能力

- 持久化`AssetProductionSession`。
- Balanced、Mobile、Cinematic三候选生成与真实文件复核。
- 技术、语义、平台、生产、完整性、几何、材质、骨架、动画、运行时/来源等就绪门。
- 非推荐候选被选择后，重新形成与所选候选一致的Bundle、Family、Lineage、Studio Import和AAF请求。
- 定点再生支持约束补丁，并保持稳定Asset ID与可追溯Generation。
- 选择、再生、接受与导出均生成封印收据和Manifest Root。
- 新增生产CLI、独立生产服务器与Gateway生命周期动作。

## 4. Reality Studio v1.5真实新增能力

- `AssetForgeSession`与`AssetForgeRegistry`。
- 真实读取RAGF候选网格、材质、物理、Prefab和就绪证据。
- 浏览器资产创生工作台支持生成、候选切换、配色定点再生、真实结构预览和接受。
- 接受资产后创建：资产登记、场景节点、RSR Capsule身体与RSR Character绑定。
- 严格兼容RAGF v0.1/v0.2/v0.3连续性包，修复旧Studio只接受v0.1的问题。
- 预览中的浮点网格只进入运行时载荷；封印Manifest仅记录根、计数与整数毫米数据，保证确定性。
- 新增CLI、Native API、离线工作台、Schema与Release Audit。

## 5. 纵向验收结果

样例：`Asset Production → Studio Forge`。

- Asset ID：`asset:ffdeebce846b016459b11e16`
- Generation：`2`
- 选择候选：`cinematic`
- 候选数：`3`
- 三角形：`120`
- PBR文件：`4`
- Studio资产总数：`5`
- 场景节点：`6`
- RSR身体：`5`
- Production Root：`e6c034895228b68eeb74f97ac74e2c4bb2ada846ce28ec178eeaa5de5dc00bb6`
- Preview Root：`0102389a805dfbc592c5bc5b27390ae89592d3b02c94db663456f990faa81296`
- Acceptance Root：`86cac80bcc631516e9eb9d0326f6847bb6bc634d1391309a846aab362f928745`
- Project Root：`45d9838bb27545ec889fa1d01f5b6ad619032ee1a8b4adf3375e62f522efc19a`
- Spatial State Root：`fnv1a64:e0353fb59b875930`
- Frame Root：`fnv1a64:d00705d06571d2ea`
- Pixel Root：`fnv1a64:0d23eed0f44448fe`
- 十项Acceptance：全部为真

## 6. 测试证据口径

### 本轮当前源码直接执行：949/949

| 套件 | 通过 | 失败 |
|---|---:|---:|
| RAGF | 146 | 0 |
| Reality Studio | 204 | 0 |
| Gateway | 12 | 0 |
| RSR | 183 | 0 |
| VSR | 183 | 0 |
| Network | 22 | 0 |
| Reality Build | 113 | 0 |
| Aether-RNCS Bridge | 14 | 0 |
| Unified Integration | 18 | 0 |
| HNAC/HNAF | 54 | 0 |
| **合计** | **949** | **0** |

### 未变源码证据绑定：506/506

- CSL Studio＋Compiler：`162/162`，当前源码树与v0.9正式ZIP逐文件一致。
- AetherFusion：`344/344`，当前源码树与v0.9正式ZIP逐文件一致。

这506项没有被描述成本轮重新执行。综合证据覆盖为`1455/1455`，其中949项为本轮直接执行，506项为未变源码与前版直接证据的哈希绑定。

## 7. Source Root复核

- CSL Studio：`da60d571ac31fedbd7efe89ccc607125064fbba9958b988ed9f2bb85aebe9912`，匹配v0.9。
- CSL Compiler：`a95542799f4a636d4be81435b7c39593a7f56f26ee2f16e4c7db87e166acd3d9`，匹配v0.9。
- AetherFusion：`02f487400e0ff94d41f7b790ccd86de96d51ee6e10ebd27597c0d95dc0d8b6e5`，匹配v0.9。

原ZIP的两个中文CSL说明文件使用非UTF-8标志保存，复核器按`CP437字节→UTF-8`恢复文件名后进行逐路径与逐内容比较；文件数和总字节数均一致。

## 8. 修复的真实问题

- Studio仅接受RAGF v0.1连续性包，已升级为显式兼容v0.1/v0.2/v0.3。
- 选择非推荐候选时，旧管线可能仍使用推荐候选的Bundle/Family/Lineage，已改为从实际选择重建。
- Gateway确定性序列化拒绝资产包中的`undefined`可选字段，Bridge现进行无损JSON净化。
- Studio启动失败信息仍显示v1.4，已同步为v1.5。
- 测试运行留下Python缓存导致Release Verification失败，清理后验证为`valid: true`。

## 9. 发布验证

- Release Verification：`valid: true`
- 模块数量：28
- 禁用目录：0
- 重复Vendor：0
- RAGF v0.4 Release Audit：PASS
- Reality Studio v1.5 Release Audit：PASS
- Gateway Health：healthy，并报告RAGF v0.4、Studio v1.5、RSR v0.9、VSR v0.8。

## 10. GitHub边界

GitHub PR #6保存v0.10可执行纵向样例、集成测试、版本Manifest、代码考古、代码审查和测试报告入口。完整RAGF、Reality Studio、Web工作台、母工程源码、构建产物与证据以正式ZIP为权威交付；不得把GitHub参考树称为完整母工程。

## 11. 真实边界

- RAGF内置生成器仍是确定性低多边形/参考资产生产器，不是电影级Text-to-3D基础模型或完整DCC。
- 当前闭环解决的是生产编排、候选比较、连续性、验收和入场景，不等于已经解决高端拓扑、美术设计、面部绑定、头发、布料和动作捕捉。
- Studio预览可读取真实网格与物理结构，但还不是Blender/Unreal级专业建模、动画和灯光编辑器。
- 外部Text-to-3D、Blender、动作捕捉、材质生成器可以作为Provider接入，但本版未把任何外部云模型虚构为内置能力。
## 12. 中文路径ZIP空目录复验

候选ZIP在新的中文路径中解压，重建25个本地Workspace后完成：

- Release Verification：PASS
- v0.10纵向资产制造验收：1/1
- RAGF生产会话：13/13
- Studio Forge与Web工作台：20/20
- Gateway RAGF桥：1/1
- Demo十项Acceptance：全部为真

开发运行与空目录运行保持相同Asset ID、Spatial State Root、Frame Root和Pixel Root。Production、Preview、Acceptance与Project Root会随新的Forge Session、节点ID和封印收据变化，这是跨会话独立审计语义，不是输出不确定性。

