# URRF Large World → glTF / VSR Provider

这组证据验证了新增的 provider 接缝：

`RNCS active scene → deterministic glTF 2.0 LOD bundle → VSR asset streaming → VSR glTF import → spatial frame / HLOD`

## 结果

- `BUNDLE: PASS`：20 个场景网格生成 60 个确定性 glTF 2.0 候选资产（LOD 0/1/2），总 payload 377,904 bytes；每个 payload 绑定 SHA-256、cell 索引和 VSR RGBA swatch texture。
- `STREAMING: PASS`：VSR `VSRSpatialAssetStreamer` 按 9 个 active cells 加载 60/60 资产，失败与阻塞均为 0，receipt root 可复验。
- `GLTF_IMPORT: PASS`：VSR importer 实际读取 LOD0 glTF，恢复 1 个 mesh、1 个材质纹理通道并生成可验证 import receipt。
- `HLOD: PASS`：导入资产和原始大世界 scene 都通过静态 HLOD；cell-aware HLOD 生成 9 个 cell cluster，并在 frame 中产生 9 个 proxy draws。
- `AUTHORITY: PASS`：manifest、asset metadata 和场景根均保持 candidate-only；RNCS 仍是世界真值 owner，provider 不能写 authoritative world state。

## 文件

- [large-world-gltf-provider-manifest.json](./large-world-gltf-provider-manifest.json)：资产清单、LOD policy、cell → asset 索引和 manifest root。
- [large-world-gltf-provider-report.json](./large-world-gltf-provider-report.json)：streaming/import/frame/HLOD 根与计数。
- [large-world-gltf-provider-reference.png](./large-world-gltf-provider-reference.png)：导入 glTF LOD0 showcase 的确定性 CPU reference；HLOD 仍由同一集成测试单独验证。

## 边界

本轮把表示织体跑通到可加载 glTF/纹理/HLOD 的 provider 候选层；网格仍来自确定性低多边形原型，内嵌纹理是 VSR RGBA swatch，不是 AAA 资产、外部纹理压缩、目标硬件帧率或生产 CDN 证明。下一条高杠杆缺口是把同一 manifest 接到真实高密度 glTF/纹理 provider，并补目标设备性能与跨 cell residency 压测。

## RCL stress accounting

- `RCL_GAP`：当前 RCL 核心没有直接表达“同一空间资产的多 LOD、纹理依赖、cell 驻留和 provider payload 校验”这一通用组合；本轮保留为显式 lowering/provider contract，没有静默绕过。
- `DONOR`：VSR glTF importer、VSR spatial asset streamer 与 cell-aware HLOD generator 提供执行语义；RNCS 仍拥有世界真值，URRF 仍拥有表示组合。
- `STRESS_CASE`：9 个 active cells、20 个 mesh family、3 个 LOD、60 个 payload 在同一 scene root 下流式加载并导入。
- `REGRESSION`：large-world runtime 21/21、VSR glTF/空间编译与本集成 1/1；所有 bundle、streaming、import、frame、HLOD receipt 可重复验证。
- `CANDIDATE_GENOME`：`{scene_root, manifest_root, bundle_root, asset_ids, lod_policy, cell_asset_index, streaming_receipt_root, gltf_receipt_root, hlod_generation_root, frame_root}`。
