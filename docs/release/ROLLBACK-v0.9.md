# Rollback v0.9

1. 使用发布前Generation或Snapshot恢复正式世界状态。
2. 将RSR依赖退回`0.8.0-alpha.1`、VSR退回`0.7.0-alpha.1`。
3. 恢复Gateway中对应运行时版本清单。
4. Network无需迁移，因为协议保持`rncs.network-runtime.v0.2`。
5. 旧材质会忽略新增纹理字段；不会污染权威状态。
