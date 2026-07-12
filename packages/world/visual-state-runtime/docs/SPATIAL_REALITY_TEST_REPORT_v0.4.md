# VSR v0.4 测试与发布报告

**版本：** 0.4.0-alpha.1  
**主题：** 三维空间现实执行器

## 结果

- v0.3及以前回归：120/120 PASS
- v0.4三维新增：33/33 PASS
- 全量测试：153/153 PASS
- Reality Studio烟雾验收：43个交互控件 PASS
- TypeScript strict：PASS
- Lint：PASS
- CLI三维参考渲染与帧验证：PASS

## 验证帧

- 场景：spatial-showcase
- 可见Draw：5
- 三角形：806
- 灯光：3
- 阴影投射者：4
- Frame Root：`10d71c4c5b496c582c93ec73f7642d960b45fe6b41faa260ddf6c632251a6a4d`
- Pixel Root：`8cbd588d755e1a74ac70f9d71b5a717f454c6a3704a84fbfebdab2a2c844d7eb`
- 深度范围：0.968030 – 0.994041

## CPU参考基准（480×270）

- 节点：97
- 三角形：1154
- 编译中位数：14.924 ms
- 编译P95：26.558 ms
- CPU参考渲染：850.460 ms

该数据仅用于确定性参考路径和回归，不代表GPU实时帧率。

## 已实现

Mesh、层级变换、相机、视锥裁剪、LOD、深度缓冲、参考金属度—粗糙度材质、三类灯光、CPU方向光阴影、WebGPU Buffer/Pipeline/Indexed Draw执行类、帧与像素证据根。

## 未伪造的边界

当前验证环境没有WebGPU Adapter，因此没有真实GPU FPS和GPU像素结果。GPU Shadow Map尚未接通；当前阴影由CPU确定性参考路径验证。尚无完整PBR、纹理/IBL、glTF、骨骼蒙皮、XR双目和大世界流送。
