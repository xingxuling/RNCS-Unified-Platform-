# Verification Matrix v0.8

| 结果 | 最小测试 | 集成证据 |
|---|---|---|
| 接触持久化 | 第二帧存在warm-start接触 | 堆叠抖动不扩大 |
| 空间分区 | 远离对象不进入候选Pair | diagnostics记录cells/pairs |
| 台阶 | 角色越过低台阶 | steppedCharacters > 0 |
| Ground Snap | 小落差保持接地 | snappedCharacters > 0 |
| 移动平台 | 角色继承平台位移 | movingPlatformTransfers > 0 |
| 单向平台 | 下穿、上落 | 不合法方向无接触 |
| glTF | Buffer/Accessor/Mesh/Node导入 | Scene可编译 |
| 纹理 | UV纹理改变pixelRoot | texture resource进入Frame Plan |
| 动画 | 采样改变节点Transform | authority root不变，presentation root变化 |
| 网络 | 旧协议全回归 | 双客户端同authority root |
