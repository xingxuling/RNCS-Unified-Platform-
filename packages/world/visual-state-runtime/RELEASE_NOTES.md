# VSR v0.5.0-alpha.1 Release Notes

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
