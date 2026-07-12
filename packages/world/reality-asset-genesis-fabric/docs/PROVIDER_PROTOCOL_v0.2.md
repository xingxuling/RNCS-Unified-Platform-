# RAGF Provider Protocol v0.2

Provider 可以是本地程序、模型服务、DCC自动化脚本或人工审核桥。

## 请求

```json
{
  "format": "reality-asset.provider-request.v0.2",
  "version": "0.2.0",
  "request_id": "provider-request:...",
  "capability_id": "asset.generate.mesh-glb",
  "output": "mesh-glb",
  "variant": "balanced",
  "genome": {}
}
```

## 响应

单文件或多文件均可：

```json
{
  "artifact": {
    "files": [
      {
        "name": "mesh/lod0.glb",
        "role": "mesh-glb",
        "mime": "model/gltf-binary",
        "base64": "..."
      }
    ],
    "metadata": {},
    "license": "CC0-1.0",
    "deterministic": false,
    "provider_evidence": {
      "model": "provider-specific-model",
      "request_root": "..."
    }
  }
}
```

Provider 不得只返回“成功”。它必须返回可校验内容和来源边界。
