# RNCS引擎升级 v0.4

**套件版本：** 0.4.0-alpha.1  
**RSR：** 0.6.0-alpha.1  
**VSR：** 0.5.0-alpha.1  
**日期：** 2026-07-03

## 目标

让RNCS从“可验证三维参考运行时”进一步进入“可制作三维游戏的核心运行基线”，同时保持确定性、证据根、Gateway发现与Studio/Build兼容。

## RSR v0.6

新增：

- Euler旋转基底，与VSR使用相同的 `Rz × Ry × Rx` 约定；
- Fixture局部位置随刚体旋转；
- 旋转Box的世界AABB；
- Sphere–OBB最近点碰撞；
- OBB–OBB 15轴SAT窄相检测；
- 量化接触点、法线与穿透深度；
- 旋转碰撞确定性重放测试；
- 发布证据按整个180 Tick运行聚合音频、触觉与脚步事件。

仍未完成：任意凸体GJK/EPA、完整接触流形、通用旋转Capsule、并行求解和生产级Ragdoll。

## VSR v0.5

CPU参考渲染器和WebGPU WGSL同时新增：

- Cook–Torrance GGX法线分布；
- Schlick Fresnel；
- Smith几何遮蔽；
- 金属度能量守恒漫反射/镜面反射分离；
- IOR介电F0；
- Clearcoat与Clearcoat Roughness；
- 材质AO强度；
- 64字节对齐材质Uniform；
- 材质变化保持Geometry Root不变、改变Material/Pixel Root的连续性测试。

仍未完成：GPU Shadow Map、纹理与法线贴图、IBL、TAA/SSAO/SSR、骨骼蒙皮、GPU粒子和大世界流送。

## 跨平台修复

原统一ZIP中的中文文件名曾被CP437错误解码。此次恢复204个Unicode文件/目录别名并删除乱码副本，包括：

- 冰境试炼行为和统一项目；
- RNCS原生项目示例；
- 霜璃资产连续性包；
- Reality Studio v0.8–v1.4离线工作台；
- Reality Build资产对账记录。

## 验收

| 部分 | 结果 |
|---|---:|
| RSR | 164/164 |
| VSR | 159/159 |
| Reality Studio | 188/188 |
| Reality Build | 113/113 |
| Reality One Gateway | 10/10 |
| 统一集成 | 11/11 |
| 合计 | **645/645** |
| Gateway运行时健康 | **12/12** |
| RSR发布审计 | PASS |
| VSR发布审计 | PASS |

证据位于 `evidence/engine-v04/`，RSR与VSR各自的完整证据位于对应包的 `evidence/` 与 `outputs/`。
