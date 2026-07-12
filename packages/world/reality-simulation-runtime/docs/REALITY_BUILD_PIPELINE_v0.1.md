# Reality Build Pipeline v0.1

## 输入

```text
reality-build.request.v0.1
projectId
target
rootDir
outDir
assets[]
```

## 编译规则

- JSON：解析后按 canonical JSON 重新编码；
- Text：CRLF 统一为 LF；
- Binary/Image：字节透传；
- 每个编译结果以 SHA-256 命名；
- Manifest 资产按 id 排序；
- dependencies 按字典序排序。

## 输出

```text
outDir/
├── cache/<sha256>.<ext>
└── manifest.json
```

Manifest 包含源哈希、内容哈希、字节数、编译路径、依赖和 Build Root。

## 无变化构建

若：

- 内容哈希相同；
- 编译路径相同；
- 缓存文件存在；

则资产被标记为 reused，不重复写入。

## 验证

`verifyRealityBuildManifest()` 会检查：

- 缓存文件是否存在；
- SHA-256 是否匹配；
- 字节数是否匹配；
- Manifest Build Root 是否匹配。

## 当前边界

v0.1 尚未实现：

- 传递式依赖失效；
- 并行构建；
- Shader 编译；
- 纹理转码；
- Mesh 优化；
- LOD；
- Streaming Bundle；
- 远程缓存。
