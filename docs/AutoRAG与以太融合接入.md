# AutoRAG与以太融合接入

## AutoRAG

`npm run index`生成整个母工程的统一路径、大小和SHA-256索引。完整AutoRAG源码保留在`tools/autorag`，但其Windows离线依赖包不再复制进发布包。

## AetherFusion

`npm run fusion -- <source> <target-module-id> <module-names> [--apply] [--verify]`。目标只能从`rncs.modules.json`中选择；应用融合后自动运行目标模块和全部下游模块测试。

示例：

```bash
npm run fusion -- ../Reality_Branch_Fabric_New rbf src --apply --verify
```
