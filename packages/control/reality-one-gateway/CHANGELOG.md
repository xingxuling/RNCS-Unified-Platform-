# Changelog

## v0.3.0

- 删除v0.2式内嵌运行时设计。
- 新增Runtime Manifest、版本选择、依赖排序和循环检测。
- 新增Node Module与stdio两种传输。
- 新增统一调用回执、超时、幂等缓存和调用日志。
- 动态接入LAF、CNP、AAF、RFE与ICAR五个独立包。
- 完成CNP→ICAR→AAF→RFE原生编排。
- 新增HTTP控制入口和中文离线工作台。
- 修复调用完成后超时定时器未清理造成的进程延迟。
