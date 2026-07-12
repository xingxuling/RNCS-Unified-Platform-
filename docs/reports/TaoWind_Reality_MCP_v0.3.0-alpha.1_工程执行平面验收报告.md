# TaoWind Reality MCP v0.3.0-alpha.1 工程执行平面验收报告

**母工程版本：** RNCS + Aetherworld Unified v0.14.0-alpha.1  
**基础版本：** v0.13.0-alpha.1  
**验收日期：** 2026-07-04  
**版本主题：** Founder Engineering Execution Plane

## 一、问题裁决

v0.2 已具备计划、候选、模拟、授权、合并、发布、回滚和 Generation，但不存在真实执行运行时，因此不能修改源码、运行构建、写入 GitHub、部署 Vercel 或调用完整 RSR/VSR。

v0.14 不是单纯扩大 MCP 权限，而是新增专用执行面：

```text
MCP控制面：权威、计划、授权、Generation、收据
                    ↓
Execution Worker：文件、命令、Git、构建、Provider、RSR/VSR
```

这种结构保留完整工程能力，同时避免把宿主根目录、长期任务和 GPU 负载直接暴露给短生命周期控制面。

## 二、实际交付

### 1. Developer Execution Runtime

新增包：

```text
packages/operations/developer-execution-runtime
```

实现：

- 绑定工作区的目录浏览、文件读取、写入、精确补丁和删除；
- 绝对路径、父目录、符号链接逃逸和密钥文件阻断；
- executable+argv 命令执行、白名单、超时、输出限制和收据；
- `founder-unrestricted` 双开关裸 Shell；
- 子进程敏感环境变量清洗；
- Git 分支、状态、差异、提交和推送；
- GitHub PR / workflow dispatch；
- Vercel Deploy Hook / API 部署与状态查询；
- Node、Python、Gradle、Android、RNCS、RSR、VSR Profile；
- 真实 RSR 模拟与真实 VSR 渲染；
- 完整工程工作流与失败自动回滚；
- 过滤式 ZIP/文件产物导出和限时下载 URL；
- Bearer 鉴权远程 Worker。

### 2. Gateway

Developer Execution Runtime 已作为第15个运行时注册到 Reality One Gateway，并能通过声明式动作路由。

### 3. MCP

TaoWind Reality MCP 升级到 v0.3.0-alpha.1：

- Founder 默认：48个工具；
- Founder Unrestricted：49个工具；
- 原权威事务链保留；
- 新增工作区、执行、Git、GitHub、Vercel、构建、RSR/VSR、产物导出和自动工程工作流工具；
- Provider 写入要求匹配当前 `state_root` 和 `revision`；
- 成功工程任务可写回新的 RNCS Generation。

### 4. 部署

- Vercel：根 `server.mjs` + `vercel.json` 作为控制面入口；
- Worker：Docker、Render、Railway 与 Compose 模板；
- CI：执行层测试、RSR/VSR产物与可选 Android Runner。

## 三、验证结果

| 测试组 | 结果 |
|---|---:|
| Developer Execution Runtime | 13 / 13 PASS |
| Reality One Gateway | 13 / 13 PASS |
| TaoWind Reality MCP | 24 / 24 PASS |
| MCP Smoke | PASS |
| 母工程集成 | 19 / 19 PASS |
| 运行时健康 | 15 / 15 PASS |
| Vercel入口 | PASS |
| Release Verification | PASS |
| npm audit | 0 vulnerabilities |
| RSR真实执行 | PASS |
| VSR真实PNG渲染 | PASS |

证据目录：`evidence/v0.14/`。

VSR产物：`output/execution-plane-vsr-v014.png`。

## 四、没有伪造完成的部分

### Android APK

已实现并测试 Android Gradle Profile，CI 也准备了 Android SDK Runner；但当前 RNCS 母工程不是 Android App，且不含可执行的 Android Gradle Wrapper，因此本次没有伪造一个 APK 验收结果。绑定带 `gradlew` 的 Android 仓库并部署 Android Worker 后，即可真实执行 `assembleDebug` / `assembleRelease`。

### 线上 GitHub / Vercel 写入

适配器、鉴权、状态前置条件和 Mock 验证已通过；本地交付包不包含用户令牌，因此没有擅自向线上仓库或生产部署写入。部署 Worker/MCP 并配置最小权限凭证后，工具即可执行真实 Push、PR 与 Deploy。

## 五、验收裁决

**通过。**

v0.14 已把 TaoWind Reality MCP 从“权威状态操作器”升级为“Founder 权威控制面＋真实工程执行面”。当前源码层已经具备用户提出的文件、命令、GitHub、Vercel、构建、RSR/VSR和自动开发闭环；线上实例仍需用本版本重新部署，能力才会出现在 ChatGPT 的 MCP 工具列表中。
