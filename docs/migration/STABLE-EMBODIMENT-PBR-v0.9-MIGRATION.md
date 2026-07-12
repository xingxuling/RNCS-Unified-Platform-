# Migration v0.9

- v0.8空间世界可继续加载；新增角色字段`coyoteTicks`与`jumpBufferTicks`均有安全默认值。
- 接触缓存新增切向信息，不改变外部Network权威帧协议。
- VSR旧材质只有Base Color时行为保持兼容；其余纹理绑定为可选。
- Gateway清单需要把RSR更新为0.9、VSR更新为0.8；Network仍为0.2。
- glTF v0.1导入收据可读取，新收据格式为`vsr.gltf-import-receipt.v0.2`。
