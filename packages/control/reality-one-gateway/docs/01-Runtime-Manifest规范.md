# Runtime Manifest v0.3

```json
{
  "format": "reality-one.runtime-manifest.v0.3",
  "runtime_id": "rncs.example",
  "runtime_version": "1.0.0",
  "gateway_protocol_versions": ["0.3.0"],
  "transport": {"kind": "node-module", "package": "@scope/package"},
  "bridge": "../src/bridges/example.bridge.mjs",
  "actions": ["health", "execute"],
  "protocols": ["example.v1"],
  "requires": [{"runtime_id": "rncs.rfe", "version_range": "^0.1.0"}]
}
```

同一`runtime_id`存在多个候选时，选择与Gateway协议兼容的最高语义版本；版本相同则使用更高priority。依赖缺失、版本不匹配或循环依赖都会阻止启动。
