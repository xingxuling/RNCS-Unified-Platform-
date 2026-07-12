# RNCS＋Aetherworld Unified v0.9.0-alpha.1 开发验收报告

## 1. 发布裁决

本版名称：**Stable Embodiment & Complete PBR Projection Runtime**。

- Mother Project：`0.9.0-alpha.1`
- RSR：`0.9.0-alpha.1`
- VSR：`0.8.0-alpha.1`
- Reality Network Runtime：`0.2.0-alpha.1`（权威状态协议未变化）
- GitHub基线：`main-95@a340a2839786f0409616645fe0aa5cd612e9892c`
- GitHub审查分支：`rncs-v09`
- GitHub提交：`9a9f95be289cd66b6b5990cdd12d6590c4948e9e`
- Pull Request：`#5`
- 本地完整母工程提交：`f77341374c06334a2808a8d6a7f61751367d7853`

## 2. 真实新增能力

### RSR v0.9

- 竖直Capsule与旋转OBB的精确最近点接触。
- 法向与切向/摩擦冲量跨Tick持久化与Warm Start。
- 接触和关节形成稳定排序的确定性约束岛。
- 约束岛级休眠与唤醒。
- Coyote Time与Jump Buffer。
- 新诊断：`capsuleObbContacts`、`warmStartedFrictionContacts`、`solverIslands`、`largestSolverIsland`、`sleepingIslands`、`coyoteJumps`、`bufferedJumps`。

### VSR v0.8

- glTF Base Color、Metallic-Roughness、Normal、AO、Emissive五类纹理绑定。
- 双线性纹理采样。
- 切线空间Normal Map。
- AO Strength、Normal Scale、Emissive与Alpha Mask进入参考渲染路径。
- 材质根、纹理根、帧根和像素根独立记录。

## 3. 纵向验收结果

样例：`Stable Aether Island PBR`。

- Authority Root：`fnv1a64:e9907f033fd78c80`
- Blue Client Root：`fnv1a64:e9907f033fd78c80`
- Red Client Root：`fnv1a64:e9907f033fd78c80`
- Temporal Presentation Root：`0863310b274b3ad7b0475b13f3b8a2a2d16805c34a69525671fc4dd384990589`
- Asset Presentation Root：`ee4a90677d8f864b23afe7de4ba8ad5ef9f1c78939ca8a2820755402b28f7097`
- Material Root：`7fd294f5c33fffdbbf9d99bc75a597d73cc7db769866f6190782dbf604b66157`
- Texture Root：`9886cf66e790dbcd259ab194497ab6eca114973de538cbdeb0b3916eb959f9d6`
- Pixel Root：`69cc66738467de58717025eade7b7b436f93ff5d7bcc113450ad7443d71ee28b`
- Capsule–OBB精确接触：3次
- 摩擦Warm Start：3次
- 最大约束岛：2体
- 休眠岛：1个
- Coyote Jump：1次
- Buffered Jump：1次
- PBR纹理绑定：5项
- 六项Acceptance：全部为真

## 4. 测试证据口径

### 本轮当前源码直接执行：954/954

| 套件 | 通过 | 失败 |
|---|---:|---:|
| RSR | 183 | 0 |
| VSR | 183 | 0 |
| Network | 22 | 0 |
| Gateway | 11 | 0 |
| Reality Studio | 188 | 0 |
| Reality Build | 113 | 0 |
| HNAC/HNAF | 54 | 0 |
| CSL Studio | 162 | 0 |
| Unified Integration | 17 | 0 |
| Unified E2E | 4 | 0 |
| Bridge | 14 | 0 |
| Native Integration | 3 | 0 |
| **合计** | **954** | **0** |

### AetherFusion证据绑定：344/344

AetherFusion源码在v0.9未修改。当前源码根：

`2e04fe981f4f41942fa50a31374af84b9d4790a1c7ca532f4c7556ea75a61025`

该根与v0.8实际执行的344/344证据一致，`verify-aetherfusion-evidence.py`返回`valid: true`和`source_root_matches: true`。本轮部分重跑受旧Python子进程清理挂起影响，因此**没有声称344项全部重新执行**。

综合证据覆盖：`1298/1298`，其中954项是本轮直接执行，344项是未变源码与前版直接证据的哈希绑定。

## 5. 关键命令和退出结果

```text
npm test --workspace @taowind/reality-simulation-runtime       → 183/183, exit 0
npm test --workspace @taowind/visual-state-runtime             → 183/183, exit 0
npm run test:network                                            → 22/22（开发工作区exit 0）
npm run test:gateway                                            → 11/11, exit 0
npm run test:bridge                                             → 14/14, exit 0
npm run test:e2e:native                                         → 3/3, exit 0
node --test tests/stable-embodiment-pbr-v09.integration.test.mjs → 1/1, exit 0
node scripts/verify-release.mjs                                 → valid true
```

空目录ZIP复验中，Network前14项明确TAP通过后外层执行看门狗超时，剩余8项按原测试名逐项执行并全部exit 0；没有把超时本身记为通过。

## 6. 产品与支持性检查

- Aetherworld：TypeScript PASS、生产构建PASS。
- CSL Studio：162/162，TypeScript PASS、生产构建PASS。
- Seed Forge：TypeScript PASS、生产构建PASS。
- AutoRAG：28/28模块。
- Gateway Health：healthy。
- Digital Blue Sky：8个源测试文件断言全部通过；两个旧长文件按测试边界拆分以绕开退出挂起。
- Release Verification：版本`0.9.0-alpha.1`、28模块、无禁用目录和重复Vendor。

## 7. 发布完整性

候选ZIP已在新的中文目录中解压并重新建立25个本地Workspace链接，随后重跑RSR、VSR、Network、Gateway、Bridge、Native E2E和v0.9纵向样例。测试会改写4个生成型`frames-manifest.json`，因此测试后哈希偏差只限于这些可再生产输出；正式ZIP的文件哈希在未执行测试的新解压目录中重新校验。

## 8. 真实边界

- Capsule–OBB当前针对竖直Capsule，不是任意姿态胶囊。
- 接触缓存仍是确定性单点持久流形，不是商业引擎级多点流形。
- 完整PBR纹理链在CPU参考渲染器中得到像素证据；WebGPU多纹理Bind Group和GPU阴影链尚未闭环。
- PNG/JPEG/KTX2等压缩图像仍由宿主资产管线解码。
- 尚未完成骨骼蒙皮、Morph Target、IBL/GI、TAA与大世界分区服务器。

## 9. 速度实测

- v0.8历史交付窗口：`52.69 min`
- v0.9可恢复墙钟窗口：`95.45 min`
- Raw speedup：`0.552x`
- Adjusted speedup：不提供虚构数值；两个版本范围和测试调度条件不同。

本轮更慢主要不是核心开发，而是全量产品构建、旧测试调度器挂起、依赖恢复、GitHub与空目录ZIP复验。核心开发窗口约9.70分钟。
