# Delivery Readiness Review v0.8

- [x] RSR新增能力有单元与全套回归。
- [x] VSR glTF、纹理、动画有单元与像素证据。
- [x] Network双客户端在自定义v0.6世界配置中收敛。
- [x] Authority Root与两个Presentation Root分离。
- [x] 中文路径运行与ZIP解压后复验纳入发布步骤。
- [x] node_modules、缓存和临时文件不进入ZIP。
- [ ] 真实GPU性能：未测量，不作为本版完成条件。

## 回归就绪补充

- 直接计数：1283/1283。
- 支持性验证：DML Core、DML Remote、IAL、AutoRAG及三产品构建全部通过。
- 发布包必须排除`.git`、`node_modules`、`__pycache__`和测试临时输出，并保留Playable World证据与PNG。
