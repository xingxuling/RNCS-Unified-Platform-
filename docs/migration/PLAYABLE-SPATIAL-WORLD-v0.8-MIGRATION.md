# v0.7 → v0.8迁移

- RSR配置推荐把`format`更新为`rsr.spatial-embodiment-world.v0.6`；v0.5仍可读取并会迁移。
- 可选配置：`broadPhaseCellSize`、`contactPersistenceDistance`。
- Character可选字段：`stepHeight`、`groundSnapDistance`、`skinWidth`、`platformInheritanceQ`。
- Fixture可选`oneWay`方向与速度门限。
- VSR场景可选`textures`、`animations`；材质可引用`baseColorTextureId`。
- glTF导入使用`@taowind/visual-state-runtime/gltf-asset`。
- Network无需更换协议；升级后必须重跑双客户端收敛测试。
