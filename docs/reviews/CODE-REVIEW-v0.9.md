# Code Review v0.9

## 关键修复

1. Capsule–OBB改为线段到有向盒最近点求解，避免AABB近似法线。
2. 接触缓存保存切向基与摩擦冲量，并受Coulomb上限约束。
3. 接触与关节通过稳定排序建立确定性约束岛。
4. 休眠从单体判断提升为岛级判断。
5. Coyote Time与Jump Buffer使用明确Tick窗口，避免重复触发。
6. VSR材质根覆盖五类纹理绑定、Normal Scale、AO Strength及Alpha参数。
7. Alpha Mask在深度写入前执行。
8. 修复`rncs.mjs`遗漏`fileURLToPath`导入，以及Gateway版本事实滞后。

## 审查边界

- CPU参考渲染证明PBR输入影响像素；不把它冒充GPU性能。
- AetherFusion本轮源码未改，使用v0.8 344/344证据的源码根复核；未声称整套重新执行。
