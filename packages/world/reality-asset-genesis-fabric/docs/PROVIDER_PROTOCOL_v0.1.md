# 外部资产生成 Provider 协议

Provider 使用标准输入输出通信。v0.1 实现 stdio：运行时向 stdin 写入一个 JSON 请求，Provider 向 stdout 返回一个 JSON 响应。

## 请求

```json
{
  "format": "reality-asset.provider-request.v0.1",
  "request_id": "provider-request:...",
  "capability_id": "asset.generate.vector-concept",
  "output": "concept-svg",
  "variant": "balanced",
  "genome": {}
}
```

## 响应

```json
{
  "artifact": {
    "mime": "image/svg+xml",
    "text": "<svg>...</svg>",
    "provider_evidence": {
      "model": "model-name",
      "model_version": "version",
      "request_id": "..."
    }
  }
}
```

二进制输出使用 `base64`。结构化输出使用 `data`。Provider 可提供 `root`，否则宿主按内容计算 SHA-256。

Provider 不是自动可信。协商选中只代表能力匹配；最终结果仍需自动验收和权威批准。
