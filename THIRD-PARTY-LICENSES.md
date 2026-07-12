# Third-Party Licenses

本母工程源码采用根目录 `LICENSE` 所示 Apache License 2.0；各内置子项目如有独立许可证，以其目录内 `LICENSE` 为准。

第三方 JavaScript 与 Python 依赖由以下锁文件/清单锁定，许可证应在再分发二进制或托管服务时按对应包要求保留：

- 根 `package-lock.json`
- `apps/aetherworld/package-lock.json`
- `apps/csl-studio/package-lock.json`
- `apps/seed-forge/package-lock.json`
- `packages/host/hnaf-hnac/pyproject.toml`
- `tools/aetherfusion/pyproject.toml`

主要直接依赖包括 React、Vite、TanStack、Radix UI、JSZip、Three.js、Wasmtime、Cryptography、Jsonschema、Websockets 与 Pytest。完整版本和传递依赖以锁文件为权威，本交付包不内嵌 `node_modules`。
