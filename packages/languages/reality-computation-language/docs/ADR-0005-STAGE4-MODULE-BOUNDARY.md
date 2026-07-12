# ADR-0005：Stage-4 模块边界

## 决策

模块系统先采用显式 `module/import/require` 契约与限定符号，不把文件系统、包管理器和动态加载伪装成已解决。

## 原因

RNCS 迁移要求跨文件类型安全和确定构建；高性能及平台实现继续作为 Provider。

## 后果

- 可以开始 RFE/AAF/Behavior/Branch 的旁路双写；
- 当前 Stage-0 仍负责 RBC 容器编码；
- Stage-5 必须完成任意模块图、循环检测、RBC encoder 与可重复自举。
