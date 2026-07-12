# Rollback v0.7

## 世界状态回滚

```text
Aetherworld 历史面板
→ 选择 Generation
→ rollbackGeneration
→ AAF owner + security 双批准
→ RFE 创建新的恢复 Generation
→ 保留原历史、目标状态根与批准证据
```

回滚不会删除历史 Generation，也不会让前端缓存成为事实。

## 代码回滚

- PR 未合并：关闭 PR 并删除功能分支。
- PR 已合并：revert 合并提交；重新运行 `npm run test:integration` 与 `npm run verify`。
- 不需要降级 RSR/VSR/Network，因为本次未改变其协议版本。
