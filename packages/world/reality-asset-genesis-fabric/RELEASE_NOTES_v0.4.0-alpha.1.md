# RAGF v0.4.0-alpha.1 Release Notes

## 资产生产会话

RAGF从一次性资产家族编译器升级为可持续的资产生产会话：

```text
资产意图 → 三候选 → 生产就绪门 → 人工选择 → 定点再生成 → 接受 → Studio连续性包
```

### 新增

- `AssetProductionSession`与独立生产服务器API
- balanced / mobile / cinematic候选生产审查
- 技术、语义、平台、生产、几何、材质、骨骼、动画、运行时和来源十类就绪门
- 非推荐候选的正确连续性重建
- 定点再生成、Generation历史、选择与接受回执
- CLI `production-demo`
- 自动测试扩展至146项

### 边界

内置Provider仍是确定性参考生产器，不等同于电影级角色生成。专业DCC、文生图、文生3D和动作捕捉应作为可替换Provider接入。
