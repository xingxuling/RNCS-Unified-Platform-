# VSR v0.1.0-alpha.12 测试报告

日期：2026-06-30  
环境：Node.js v22.16.0 / Linux

## 静态与构建验证

- `npm run typecheck`：PASS
- `npm run lint`：PASS
- `npm run build`：PASS

## 机制验证

- 机制测试：76/76 PASS
- Studio 交互入口：43/43 PASS
- Visual IR、增量缓存、确定性重放：PASS
- 观察者／设备／交互／共享现实：PASS
- RSR 分支模拟与 RFE 提交桥：PASS
- GPU 文字、纹理、Path 与混合层：PASS
- Reality Studio v0.4 UID、层级、Blackboard 与信号：PASS
- Studio Live Event SHA-256 链：PASS
- 无效结构编辑原子拒绝：PASS
- HNAC v0.5 Python 参考状态根：PASS
- HNAC Portable Bundle 导出—恢复与分区隔离：PASS
- HNAC 三方合并冲突证据：PASS
- Reality One v0.2 HTTP Preview／Execute：PASS
- 交互及生命周期 SHA-256 承诺：PASS
- Alpha.12 Schema Draft 2020-12：PASS

## Alpha.12 性能证据

| 场景 | 中位数 | P95 |
|---|---:|---:|
| HNAC 快照与 Bundle 导出 | 0.411 ms | 1.147 ms |
| Studio Blackboard 实时事件 | 1.513 ms | 2.210 ms |
| Studio 结构性实时事件 | 5.366 ms | 5.968 ms |
| HNAC 三方合并 | 0.219 ms | 0.925 ms |
| Gateway 权限往返（内存传输） | 2.473 ms | 4.012 ms |

专项压力验证包括 500 条连续 Studio 事件、30 次结构重建、500 次 HNAC 快照／导出和 500 次三方合并。

## CLI 实链

- `replay-reality-studio`：PASS
- `hnac-state`：PASS
- `restore-hnac-state`：PASS
- `submit-reality-one`：PASS
- `schema --kind hnac-state`：PASS
- `schema --kind reality-studio-live`：PASS
- `schema --kind reality-one-gateway`：PASS

真实 Reality One v0.2 Gateway 回执：

- Gateway Status：`committed`
- Final Global Root：`9731be010ef7a49ccc9ce5e92600b1b3e131fd9f49e8fd3d46b045da1b5589f8`
- Receipt Root：`b14989e411cfda72544860e12400f7dd32c9b1c784a7613ae7492ea872e5854e`

## 声明边界

Alpha.12 的 HTTP Gateway 是参考传输层，尚未包含 TLS、登录认证、Ed25519 请求签名与生产级重试队列。HNAC Bundle 不携带 secret、device-private 和 transient 状态。发布包不携带任何字体文件。
