# RNCS + Aetherworld Unified v0.14.0-alpha.1

## 版本主题

**TaoWind Founder Engineering Execution Plane**

v0.13 建立 Founder Authority；v0.14 补齐真实工程执行面，使 MCP 能把计划和授权连接到源码、命令、构建、Git、GitHub、Vercel、RSR/VSR 与交付产物。

## 主要升级

- 新增第15运行时：Developer Execution Runtime。
- MCP 从22个在线工具升级为 Founder 默认48个、Break-glass 49个。
- 工作区内文件读写、补丁、删除、过滤导出。
- 受控命令、超时、输出限额与执行收据。
- Git 分支、差异、提交、推送。
- GitHub PR/Actions 与 Vercel 部署适配器。
- Node、Python、Gradle、Android、RNCS、RSR、VSR 构建 Profile。
- RSR真实模拟和VSR真实渲染工具。
- 自动工程工作流及失败回滚。
- Vercel控制面＋持久Worker双层部署结构。
- 外部写入的权威状态前置条件。
- 子进程 Provider 密钥隔离。

## 兼容性

- Node.js >= 20。
- 保留 v0.13 Founder Authority API。
- 原14个运行时保持，新增第15运行时。
- Android真实构建要求项目自带 Gradle Wrapper，并由 Worker/CI 安装 JDK 与 Android SDK。
