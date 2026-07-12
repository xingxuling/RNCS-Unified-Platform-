# 系统架构 v0.6：权威世界与时间投影

## 权威链

`AAF → Network Server → RSR Spatial World → Authoritative Frame/Delta → RFE Evidence`

只有服务器中的 RSR 实例能够提交正式世界状态。客户端 RSR 仅是预测副本，VSR 仅是观察投影。

## 状态层

- **Generation**：RFE 长期现实代际。
- **Tick**：RSR 固定时间步。
- **Authoritative State Root**：RSR 当前事实证明。
- **Network Packet Root**：传输载荷证明。
- **Presentation Root**：VSR 某个观察时刻的画面证明。

三种根不得互换。

## 故障边界

- 错误增量根：拒绝。
- 不存在的基线根：隔离并请求完整快照。
- 丢包/乱序：不允许权威 Tick 回退。
- 预测偏差：恢复权威快照并重放未确认输入。
- 大位移或显式不连续：VSR Snap，不做跨空间插值。
