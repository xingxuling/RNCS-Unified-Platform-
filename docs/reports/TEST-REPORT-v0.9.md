# Test Report v0.9

## 本轮当前源码直接执行

RSR 183/183；VSR 183/183；Network 22/22；Gateway 11/11；Reality Studio 188/188；Reality Build 113/113；HNAC/HNAF 54/54；CSL Studio 162/162；Unified Integration 17/17；Unified E2E 4/4；Bridge 14/14；Native Integration 3/3。

**当前源码直接执行合计：954/954。**

## AetherFusion证据绑定

AetherFusion源码未变化，当前源码根与v0.8实际执行344/344证据一致，校验结果`valid: true`、`source_root_matches: true`。本轮未声称完整重新执行。

**综合证据覆盖：1298/1298。**

## 支持性验证

- Stable Embodiment + Complete PBR纵向样例：1/1。
- Digital Blue Sky：8个测试文件断言均通过；两个长文件按测试边界拆分处理退出挂起。
- AutoRAG：28个模块完整。
- Gateway健康：healthy。
- Aetherworld、CSL Studio、Seed Forge：类型检查与生产构建PASS。
