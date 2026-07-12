# Visual State Runtime（VSR）v0.8.0-alpha.1

VSR是RNCS的独立视觉时间投影、三维资产和可验证像素执行层。

## v0.8 Complete PBR Projection

- glTF Base Color、Metallic-Roughness、Normal、Occlusion、Emissive纹理映射。
- Nearest与Bilinear采样。
- 切线空间Normal Map。
- Alpha Mask在深度写入前裁剪。
- 五类纹理绑定进入Import Receipt、Draw Packet、Material Root、Texture Root和Frame Root。
- 材质与动画只改变Presentation Root，不改写Authority Root。

## 运行

```bash
npm run typecheck
npm run test:spatial-3d
npm run test:gltf
npm test
```

## 真实性边界

- 当前完整PBR纹理执行已在确定性CPU参考光栅路径验证。
- 浏览器WebGPU纹理Bind Group、GPU Shadow Map、IBL/GI和真实GPU性能仍待硬件验收。
- 压缩图像解码仍由宿主资产管线提供RGBA。
- 尚无骨骼蒙皮、Morph Target、TAA和XR双目。
