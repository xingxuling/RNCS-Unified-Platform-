# VSR v0.5.0-alpha.1 Release Notes

## High-Fidelity Continuation

- Added bounded motion-vector temporal reprojection: frame plans carry current/previous instance transforms and velocity controls, CPU/WebGPU paths share velocity attachments and weighted-OIT velocity resolve, and temporal resolve applies velocity dilation plus previous-depth/history-velocity rejection.
- Real Chromium WebGPU evidence now includes `velocity_static` and `moving_velocity` frames; all thirteen temporal/field/residency/velocity frames submit successfully with no device loss or page/WGSL/request errors.
- Added default weighted-blended OIT for transparent materials with rooted accumulation/revealage textures, a resolve composite pass, CPU order-independent reference composition, and a `sorted` compatibility mode.
- Real Chromium WebGPU temporal regression now asserts `oitPasses=2`, `transparentDraws=2`, `velocityPasses=1`, successful submission, no device loss, and no page/WGSL/request errors across thirteen temporal/field/residency/velocity frames.
- Added bounded screen-space dynamic indirect light to the rooted post-process contract; CPU reference and WebGPU tone-map share depth/color sampling, and real Chromium receipt evidence reports `ssgiPasses=1`. This remains local SSGI, not full DDGI/Lumen.
- Added a deterministic irradiance probe bake artifact with source/root verification; generated probes enter the existing CPU/WebGPU environment-probe buffer and real Chromium receipt evidence reports `irradianceCacheProbes=4`. This remains a bounded probe cache, not full DDGI.
- Added `evidence:irradiance-bake`, which persists and re-reads `outputs/spatial-irradiance-probe-bake/probe-bake.json`, then emits a CPU reference PNG and rooted evidence summary.
- Added `evidence:lightmap-bake`, which persists and re-reads a bounded static triangle-chart lightmap, applies generated UV1/mesh/material bindings, and emits a CPU reference PNG plus rooted evidence summary.
- Static lightmap baking is now `vsr.spatial-lightmap-bake.v0.2`: fixed-point geometric visibility samples darken occluded charts and deterministic texel dilation fills atlas padding; production seam packing, complete leakage control and dynamic GI remain explicit follow-up work.
- Added `vsr.spatial-irradiance-volume.v0.1`: bounded persistent 3D irradiance samples, source/topology roots, static visibility, incremental light updates, CPU trilinear sampling, WebGPU storage binding 8, `evidence:irradiance-volume`, and real Chromium receipt evidence with `irradianceVolumeSamples=48`; full DDGI/Lumen remains outside this contract.
- Added `vsr.spatial-irradiance-volume-field.v0.1`: deterministic multi-volume field persistence, streaming-cell selection, bounded AABB blending, active-field root verification, shared CPU/WebGPU binding-8 packing, and `evidence:irradiance-volume-field`; cross-volume leakage/occlusion and full DDGI/Lumen remain outside this contract.
- VSR regression is now 122/122 core, 94/94 spatial, 4/4 asset streaming, 21/21 glTF, and 11/11 temporal presentation tests.
- Temporal resolve now has bounded luminance-derived, authored/material, conservative skin/morph reactive coverage, and motion-vector velocity coverage shared by CPU and WebGPU; real Chromium covers bright history suppression, an actual material reactive texture binding, and moving-object reprojection, while higher-order disocclusion/TAA history heuristics remain outside the contract.

- CPU reference renderer and WebGPU WGSL now share Cook-Torrance GGX PBR.
- Added Fresnel-Schlick, Smith masking-shadowing, energy-conserving metallic workflow.
- Added material AO, clearcoat, clearcoat roughness and IOR.
- Material uniform expanded to an aligned 64-byte layout.
- Added deterministic PBR and pixel-root regression tests.

# VSR v0.4.0-alpha.1 Release Notes

本版完成从“二维WebGPU视觉执行”到“三维空间现实基础执行”的第一次跨越。

核心新增：Indexed Mesh、三维层级变换、透视/正交相机、视锥裁剪、LOD、深度缓冲、金属度—粗糙度材质、三维灯光、方向光阴影参考路径、WebGPU资源打包与真实浏览器执行类，以及Geometry / Material / Command / Frame证据根。

全量测试153/153通过，其中120项为v0.3及以前回归，33项为v0.4新增三维测试。Reality Studio烟雾验收43个交互控件通过。

当前环境没有WebGPU Adapter，因此发布结论严格限定为：三维帧编译、CPU确定性参考像素、WGSL、GPU资源布局、浏览器执行代码和证据收据已完成；真实显卡像素、性能、驱动兼容与GPU阴影仍需在支持WebGPU的设备上继续验收。
