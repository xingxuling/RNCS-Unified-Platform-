# Reality Studio v1.5.0-alpha.1 Release Notes

## 资产创生工作台

Reality Studio首次形成原生资产制造闭环：

```text
资产意图 → RAGF三候选 → 真实结构预览 → 定点再生 → 接受 → 场景节点＋RSR身体/角色
```

### 新增

- `AssetForgeSession`与会话Registry
- 原生服务API、CLI和浏览器工作台
- 真实网格、PBR、Prefab与具身配置预览
- 严格导入RAGF v0.3/v0.4连续性包
- 接受后创建资产记录、场景节点、RSR身体和角色绑定
- Production / Preview / Acceptance / Project根联合清单
- Reality Studio测试扩展至204项

### 修复

- 修复Studio仅接受RAGF v0.1 Bundle的版本断裂
- 健康端点同步为RAGF v0.4、RSR v0.9、VSR v0.8
- 预览运行时数据与可封印清单分离，避免浮点数据污染确定性项目根
