# Reality Studio v0.9 API

## 核心函数

- `createAssetRecord(bundle, options)`：把 RAGF Continuity Bundle 转成 Studio 资产记录。
- `verifyAssetRecord(record, options)`：验证文件存在性与 SHA-256。
- `createSceneNode(options)`：创建场景节点。
- `createSceneFromBehavior(program)`：从行为实体生成初始场景。
- `createUnifiedProject(options)`：创建统一项目。
- `validateUnifiedProject(project)`：结构与引用验证。
- `createSceneProjection(project, inspection, options)`：生成玩家或调试投影。

## UnifiedManufacturingSession

- `importAsset`
- `addAssetNode`
- `patchNode`
- `moveNode`
- `removeNode`
- `select`
- `replaceBehavior`
- `undo` / `redo`
- `step` / `run` / `pause` / `reset`
- `inspect`
- `exportArtifacts`

## HTTP

- `GET /api/unified/sample`
- `POST /api/unified/validate`
- `POST /api/unified/session/new`
- `POST /api/unified/session/inspect`
- `POST /api/unified/session/command`
- `POST /api/unified/session/export`
