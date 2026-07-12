# Reality Studio 资产连续性合约 v1.3

## 目标

资产不再只是“某个文件夹里的文件”，而是具有稳定身份、来源、内容根、依赖、代际、状态与构建证据的持续对象。

## 最小闭环

```text
源文件/嵌入数据
→ 类型与角色识别
→ SHA-256内容寻址
→ 稳定Asset ID
→ 依赖提取
→ 注册到项目资产目录
→ 场景引用
→ 重导入与代际推进
→ 审计
→ 连续性账本进入构建产物
```

## 核心对象

### Asset Record

- `asset_id`：稳定身份；内容变化不得自动改变身份。
- `asset_root`：当前资产记录的确定性根。
- `source.sha256`：源内容摘要。
- `import_state.generation`：重导入代际。
- `dependencies`：资产或文件依赖。
- `status`：`ready`、`missing` 等。

### Dependency Graph

记录资产间依赖、场景使用关系、无法解析的依赖与孤儿资产。

### Continuity Audit

检查：

- 源文件缺失；
- 源内容陈旧；
- 文件摘要不一致；
- 场景引用无法解析；
- 资产依赖无法解析；
- 未被使用的孤儿资产。

### Continuity Ledger

把资产摘要、依赖图、审计结果和项目根封装为可验证构建输入。

## 权威规则

1. 重导入必须保留 `asset_id`。
2. 内容变化必须推进 `generation`。
3. 旧 `asset_root` 必须进入有限历史。
4. 构建输出必须绑定 `ledger_root`。
5. 缺失资产不得被伪装为已就绪。
6. 浏览器导入可作为嵌入资产，但不可声称可从本地源自动重导入。

## 当前支持

PNG、JPEG、WebP、GIF、SVG、WAV、OGG、MP3、FLAC、JSON、YAML、文本、Markdown、GLSL、WGSL、JavaScript、TypeScript、TTF、OTF、WOFF、WOFF2。

## 当前边界

- 尚未实现Aseprite、Tiled、glTF、FBX等专用解析器；
- JSON依赖提取为通用路径扫描，不等价于完整格式语义；
- 目录监听和自动热重导入尚未实现；
- 大型资产缓存、压缩与派生物管线尚未实现；
- 浏览器嵌入资产会增加项目JSON体积。
