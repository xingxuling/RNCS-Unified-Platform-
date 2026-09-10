# External Transport Donor Archaeology — 2026-09

## 裁决

`DONOR_FOUND_REUSE_BLOCKED_BY_LICENSE_AND_DEPLOYMENT_BOUNDARY`

本轮没有把历史 DuoWorld Relay 源码复制进 RNCS。它可以证明一组 transport/provider 能力存在过，但不能直接成为 RNCS canonical runtime、生产安全实现或发布依赖。

## RNCS 当前真实基线

Reality Network Runtime 当前拥有：

- `LoopbackTransport`：确定性延迟、丢包、重复、乱序、带宽和断线模拟；这是测试 Provider，不是外部网络部署。
- `HttpAuthorityClient`：基于 `fetch` 的 authority join/input/tick/snapshot/delta HTTP candidate；它复用 `ClientPredictionRuntime`，但不是长连接 transport。
- Reality Build headless target：可通过 `RNCS_NETWORK_CHECKPOINT_PATH` 保存/恢复 checkpoint；恢复已在两个独立 Node server 进程间验证。

当前没有可复用的 RNCS WebSocket、UDP、QUIC、WebRTC、TLS listener、跨节点 lease 或 public relay 实现。

## 历史 donor

来源：`C:/Users/User/Documents/RCL/DuoWorld_StableDesktop_v1.1`

已定位的实现：

- `public_relay/relay_server.js`：无第三方依赖的 HTTP upgrade/WebSocket frame parser、room lifecycle、origin allow-list、connection/room/message limits、heartbeat、idle cleanup、reconnect grace 和随机 reconnect token。
- `gateway/relay_bridge.js`：Node `net`/`tls` outbound WebSocket handshake、WSS URL normalization、frame parser、reconnect loop 和 peer forwarding。
- `gateway/host_gateway.js`：direct/LAN/public-relay/diagnostics fallback 顺序以及 UDP LAN discovery。
- `desktop/invite.js`：direct WebSocket 与 relay invite 的显式区分；room code 不是 credential。

本机重跑结果：

- `node --check public_relay/relay_server.js`：`PASS`
- `node --check gateway/relay_bridge.js`：`PASS`
- `node tests/public_relay_test.js`：`PUBLIC_RELAY_PROTOCOL_PASS`
- `node tests/gateway_relay_bridge_test.js`：`GATEWAY_RELAY_BRIDGE_PASS`

这些结果只证明本机单进程/本机 loopback relay protocol 和 gateway bridge candidate，不能证明公网 DNS/TLS/reverse proxy、第二网络、NAT、生产密钥、跨节点权威或 SLA。

## 复用与权威边界

| 能力 | 可吸收内容 | 当前裁决 |
|---|---|---|
| WebSocket framing/heartbeat/limits | Provider contract 的候选输入 | 可研究；不能复制实现后宣称 RNCS native |
| relay room/reconnect | 外部 transport provider 行为 | 只能作为 Auxiliary/Provider；不能拥有 RSR/Network canonical state |
| WSS/TLS outbound | 部署层能力 | 需要证书、密钥托管、origin、反向代理和生产安全裁决 |
| UDP discovery | 局域网辅助发现 | 不能作为公网身份或 authority；Android/Web target 也不能静默依赖它 |
| room code/token | donor 的协作协议 | room code 不是认证；RNCS AAF/外部身份仍必须独立验证 |

历史项目的 `LICENSE_AUDIT.md` 明确记录：项目是 private preview、没有完整根许可证，审计不是法律授权；同时其 Relay public deployment、DNS/TLS、reverse proxy 和异网双机测试仍未完成。因此本 donor 的代码不能直接进入 RNCS 包或发布产物。

## 当前 RCL Gap

`RCL_GAP_RNCS_EXTERNAL_TRANSPORT_AND_DEPLOYMENT`：

- missing capability：面向浏览器、Node、Android/native 的统一外部 transport provider contract，以及带 TLS/身份/限流/重连/跨节点 lease 证据的实际执行链；
- current workaround：Loopback/HTTP candidate；
- donor advantage：历史 Relay 已证明 WebSocket room、heartbeat、reconnect 和 WSS outbound 的局部 Provider 形态；
- owner：Network Runtime 保留 packet/session/state-root 语义，transport/provider 不得成为 authority；
- blocked promotion: donor license/owner approval、canonical transport choice、TLS/key custody、跨节点 authority 与真实第二网络测试。

## 下一步需要的战略裁决

在继续实现外部 transport 之前，需要确定：

1. canonical external transport 选择 `WebSocket/WSS`、`WebTransport/QUIC`，还是继续把 HTTP 维持为 candidate；
2. 是否允许历史 DuoWorld Relay 仅作为外部 Provider 参考，或必须使用有明确许可证的独立实现/第三方依赖；
3. TLS 证书、密钥、origin、relay、leader/lease 和跨节点 failover 的 authority owner。

没有这三个裁决，继续写一个 RNCS 自有 socket/relay 会制造重复语义和未授权发布风险。没有新增 K400 PASS。
