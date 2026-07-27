# Visual State Runtime（VSR）v0.8.0-alpha.1

VSR是RNCS的独立视觉时间投影、三维资产和可验证像素执行层。

## v0.8 Complete PBR Projection

- glTF Base Color、Metallic-Roughness、Normal、Occlusion、Emissive纹理映射。
- Nearest与Bilinear采样。
- 切线空间Normal Map。
- Alpha Mask在深度写入前裁剪。
- 五类纹理绑定进入Import Receipt、Draw Packet、Material Root、Texture Root和Frame Root。
- 材质与动画只改变Presentation Root，不改写Authority Root。
- 浏览器WebGPU三维执行器已接入五路材质纹理Bind Group和方向光GPU Shadow Map depth pass。
- WebGPU Frame Receipt记录材质纹理绑定数与shadow pass数；设备无关fake-device验收覆盖完整编码链。
- WebGPU与CPU参考路径已接入四影响骨骼蒙皮和最多四个Morph Target；glTF JOINTS_0、WEIGHTS_0、skins与targets/POSITION可直接导入。
- 动画采样保留glTF原生四元数，支持最短弧SLERP、STEP、LINEAR和CUBICSPLINE Hermite关键帧；旋转不再先降成欧拉角。
- 编译选项支持确定性动画图状态、状态过渡、Override/Additive图层和显式node mask；混合结果进入Animation Root与Frame Root。
- 变形状态进入Draw Packet、Geometry Root、joint/morph GPU resource root和Frame Root。
- 新增 `compileSpatialFrameFromVisualIntent()`，消费 RCL `taowind.rcl-rncs-visual-intent.v0.1`，验证 intent root 后把动画选择、节点遮罩、look-at/two-bone IK、skin/morph 变形和 visual intent root 纳入帧计划。
- `animationConstraints` 支持确定性 `look-at` 与 `two-bone-ik`；约束在动画图/图层采样之后解算，结果进入 Animation Root、Draw Packet 与 Frame Root。
- 新增确定性环境光照项：diffuse/specular environment colors 与 intensity 同时进入 CPU 参考路径、WebGPU Camera uniform、Environment Root 和 Frame Root；这是统一环境光照，不冒称图像探针 IBL。
- `environment.textureId` 接入 RGBA equirectangular 环境纹理；CPU 与 WebGPU 使用相同方向到经纬度 UV 和 roughness lobe 混合，纹理采样进入 Environment Root、Texture Root 和 Frame Root。

## 运行

```bash
npm run typecheck
npm run test:spatial-3d
npm run test:gltf
npm test
```

## 真实性边界

- CPU参考光栅与fake WebGPU设备编码链均已验证完整PBR纹理和GPU Shadow Map资源边界。
- 真实浏览器GPU adapter、纹理采样结果、Shadow Map像素正确性和GPU性能仍待硬件验收；当前不声称实机帧率。
- 压缩图像解码仍由宿主资产管线提供RGBA。
- 预过滤 mip、反射探针混合、局部/全局 GI、服务器级世界分区仍未完成；当前环境纹理是单张 equirectangular、无 mip 的确定性基础 IBL。
- TAA、XR双目仍未完成；真实硬件GPU像素/性能验收仍待浏览器环境。
- GameBrain/RCL 的视觉意图接入是受控帧编译输入，不等于外部世界提交；权威提交仍由 RNCS 控制平面和人工授权负责。
