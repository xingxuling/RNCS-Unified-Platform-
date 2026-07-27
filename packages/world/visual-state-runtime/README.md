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
- IBL/GI、服务器级世界分区仍未完成。
- 尚无骨骼蒙皮、Morph Target、TAA和XR双目。
