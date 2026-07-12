# Reality Studio 资产连续性 API v1.3

## 模块入口

```js
import {
  createLocalAssetRecord,
  createEmbeddedAssetRecord,
  reimportLocalAsset,
  importAssetSource,
  buildAssetDependencyGraph,
  auditAssetContinuity,
  createAssetContinuityLedger
} from './src/asset-continuity.mjs';
```

## CLI

```bash
# 导入单个文件或目录
node src/cli.mjs asset-import \
  --project examples/冰境试炼.unified-project.json \
  --source ./my-assets \
  --out output/project-with-assets.json

# 重导入单个资产
node src/cli.mjs asset-reimport \
  --project output/project-with-assets.json \
  --asset asset:local:... \
  --out output/project-reimported.json

# 重导入全部本地资产
node src/cli.mjs asset-reimport --project project.json --all

# 审计
node src/cli.mjs asset-audit --project project.json --strict-files

# 导出连续性账本
node src/cli.mjs asset-ledger --project project.json --out output/asset-ledger.json
```

## 权威服务命令

`POST /api/unified/session/command`

- `import-local-asset`
- `import-embedded-asset`
- `import-asset-source`
- `reimport-asset`
- `reimport-all-assets`
- `audit-assets`
- `asset-dependency-graph`
- `asset-ledger`

### 浏览器嵌入导入示例

```json
{
  "session_id": "unified-session:...",
  "command": "import-embedded-asset",
  "file": {
    "name": "hero.svg",
    "mime": "image/svg+xml",
    "dataBase64": "PHN2Zy4uLj4=",
    "dataUrl": "data:image/svg+xml;base64,PHN2Zy4uLj4="
  }
}
```

## 构建输出

`exportArtifacts()` 新增：

- `asset_continuity_ledger`
- `asset_manifest.asset_ledger_root`
- `asset_manifest.dependency_graph_root`
- `asset_manifest.audit_root`
- `build_plan.files[]` 中的 `asset-continuity-ledger.json`
