# Aether Earth v0.1 Android 构建与后台运行说明

## 1. 工程位置

母工程内：

```text
apps/aether-earth-android
```

独立交付包会同时提供 Android 源码 ZIP。

## 2. 构建要求

- Android Studio；或 JDK 21 + Android SDK；
- compileSdk 35；
- build-tools 35；
- Android Gradle Plugin 8.7.3；
- 建议 ARM64 Android 10 以上真机。

打开工程后执行：

```bash
./gradlew assembleDebug
```

APK 预期位置：

```text
app/build/outputs/apk/debug/app-debug.apk
```

本次容器没有 Android SDK 和 Gradle distribution，因此没有伪造该文件。

## 3. 前台持续世界

`WorldSimulationService`：

- 启动后创建低优先级通知频道；
- 使用前台服务保持用户可见；
- 每 15 秒推进 `timeScale` 个逻辑日；
- 通知显示当前世界日、100 个生物和倍率；
- Service 被系统回收后使用 `START_STICKY` 请求恢复。

这不保证所有厂商系统永久保活。用户仍可能需要关闭电池优化或允许自启动。

## 4. 普通后台补算

`CatchUpJobService`：

- 由 JobScheduler 周期触发；
- 根据上次墙钟时间计算离线分钟；
- 按倍率换算逻辑日；
- 单次最多补算 720 天；
- 执行后重新保存 GZIP 状态胶囊。

Android 会根据电量、Doze、温度和厂商策略延迟任务，这是系统约束，不应绕过。

## 5. 状态恢复

状态写入：

```text
SharedPreferences
→ JSON
→ GZIP
→ Base64 capsule
```

保存内容包括 256 瓦片、100 个主体、时间倍率、知识数、结晶和 Reality Root。胶囊损坏时当前原型会恢复初始世界。

## 6. 当前 Android 与完整 RNCS 引擎差异

Android Java 引擎是轻量宿主，主要验证：

- 100 主体持续运行；
- 前台/后台生命周期；
- 离线补算；
- 压缩持久化；
- 移动端交互。

完整 Node/RNCS 引擎额外提供：

- 512 条完整 RCLpedia 对象；
- 原生 RCL/RBC 结晶验证；
- 更完整的观察、证据和报告；
- Gateway 与 RNCS Registry。

下一阶段应使用 Android NDK/JNI 编译并嵌入 `librclvm` ARM64，把两条执行链进一步统一。
