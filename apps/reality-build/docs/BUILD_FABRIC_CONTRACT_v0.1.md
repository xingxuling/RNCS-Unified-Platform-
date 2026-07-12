# Reality Build Fabric Contract v0.1

## 输入

- Reality Studio Unified Project v0.9；
- 构建目标；
- 应用身份与版本；
- 质量档位；
- 缺失资产策略；
- 固定构建时间。

## 构建图

```text
validate
  ↓
asset-bake
  ├─ web-release
  ├─ web-single
  ├─ windows-portable
  └─ android-project
        ↓
receipt
```

## 不变量

1. 项目格式和活动场景必须有效；
2. 所有正式资产必须经过 SHA-256 对账；
3. 相同内容只写入一次内容地址；
4. 相同项目、目标、质量和应用身份产生相同 Build Key；
5. 输出目录不参与语义构建键；
6. 每个目标必须生成 Target Receipt；
7. Build Receipt 必须引用所有 Target Root；
8. 文件被修改后验证必须失败；
9. 性能指标不进入确定性根；
10. 平台未编译时必须明确记录 `apk_built=false` 或 `native_executable=false`。

## 目标状态

| 目标 | v0.1状态 | 是否实际运行 |
|---|---|---|
| Web Release | 完成 | Chromium 完整通关 |
| Web Single | 完成 | Chromium 完整通关 |
| Windows Portable | 完成（浏览器宿主） | Chromium 等价宿主完整通关 |
| Android Project | 工程完成 | 静态结构验收；未编译 APK |

## 证据对象

- `build-graph.json`
- `validation.json`
- `asset-manifest.json`
- `integrity-manifest.json`
- `target-receipt.json`
- `build-receipt.json`
- `build-metrics.json`
