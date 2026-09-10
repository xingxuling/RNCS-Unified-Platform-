# External Transport Donor Archaeology — 2026-09

## 裁决

`SEMANTIC_TRANSPORT_REUSED_EXTERNAL_PROVIDER_NOT_PROMOTED`

本轮没有把历史 DuoWorld Relay 源码复制进 RNCS。RNCS 已有的 URRF/Reality Transport Fabric 语义契约被复用到 Network Runtime 的 Loopback candidate；历史 DuoWorld Relay 只作为物理 WebSocket/relay Provider donor，不能直接成为 RNCS canonical runtime、生产安全实现或发布依赖。

## RNCS 当前真实基线

Reality Network Runtime 当前拥有：

- `RealityTransportFabric` semantic seam：`FIBER/WIFI/BLUETOOTH/RDN` profiles、QoS/packet types、profile/packet roots、candidate-only/authority admission 和 discovery/association/roaming/Organ Link 记录；该 Fabric 不拥有 canonical world state。
- `LoopbackTransport`：确定性延迟、丢包、重复、乱序、带宽和断线模拟；这是测试 Provider，不是外部网络部署。
- Loopback 已通过 `RDN` local candidate profile 把 input/ack/rejection/delta/snapshot 绑定为 URRF transport packets，并在 health 中暴露 transport/fabric root；这只是 semantic carrier binding，不是物理链路证明。
- `HttpAuthorityClient`：基于 `fetch` 的 authority join/input/tick/snapshot/delta HTTP candidate；它复用 `ClientPredictionRuntime`，但不是长连接 transport。
- Reality Build headless target：可通过 `RNCS_NETWORK_CHECKPOINT_PATH` 保存/恢复 checkpoint；恢复已在两个独立 Node server 进程间验证。

当前仍没有可复用的 RNCS WebSocket、UDP、QUIC、WebRTC、TLS listener、跨节点 lease 或 public relay 实现；URRF semantic packet 不应被误报为这些 physical provider。

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
| URRF transport profile/packet seam | canonical profile、QoS、packet root、候选/权威 admission 语义 | 已复用；由 Core Contract/Reality Transport Fabric 保持语义 owner，Network Runtime 只绑定 Loopback carrier，不产生第二套 packet schema |
| WebSocket framing/heartbeat/limits | Provider contract 的候选输入 | 可研究；不能复制实现后宣称 RNCS native |
| relay room/reconnect | 外部 transport provider 行为 | 只能作为 Auxiliary/Provider；不能拥有 RSR/Network canonical state |
| WSS/TLS outbound | 部署层能力 | 需要证书、密钥托管、origin、反向代理和生产安全裁决 |
| UDP discovery | 局域网辅助发现 | 不能作为公网身份或 authority；Android/Web target 也不能静默依赖它 |
| room code/token | donor 的协作协议 | room code 不是认证；RNCS AAF/外部身份仍必须独立验证 |

历史项目的 `LICENSE_AUDIT.md` 明确记录：项目是 private preview、没有完整根许可证，审计不是法律授权；同时其 Relay public deployment、DNS/TLS、reverse proxy 和异网双机测试仍未完成。因此本 donor 的代码不能直接进入 RNCS 包或发布产物。

## 当前 RCL Gap

`RCL_GAP_RNCS_EXTERNAL_TRANSPORT_PROVIDER_AND_DEPLOYMENT`：

- missing capability：在既有 URRF semantic profile/packet seam 之上，面向浏览器、Node、Android/native 的统一 external transport provider execution，以及带 TLS/身份/限流/重连/跨节点 lease 证据的实际执行链；
- current workaround：URRF candidate packet + Loopback carrier binding + HTTP authority candidate；
- donor advantage：历史 Relay 已证明 WebSocket room、heartbeat、reconnect 和 WSS outbound 的局部 Provider 形态；
- owner：Core Contract/Reality Transport Fabric 保留 transport semantic owner，Network Runtime 保留 session/state-root/authority owner，physical transport/provider 不得成为 authority；
- blocked promotion: donor license/owner approval、canonical transport choice、TLS/key custody、跨节点 authority 与真实第二网络测试。

## 下一步需要的战略裁决

在继续实现 physical external transport 之前，需要确定：

1. canonical external transport 选择 `WebSocket/WSS`、`WebTransport/QUIC`，还是继续把 HTTP 维持为 candidate；
2. 是否允许历史 DuoWorld Relay 仅作为外部 Provider 参考，或必须使用有明确许可证的独立实现/第三方依赖；
3. TLS 证书、密钥、origin、relay、leader/lease 和跨节点 failover 的 authority owner。

没有这三个裁决，继续写一个 RNCS 自有 socket/relay 会制造重复语义和未授权发布风险。没有新增 K400 PASS。

## 2026-09-10 re-audit

本轮对外部状态重新核对，没有发现可以替代本地考古结论的更新资产：`origin/main` 当前仍为 `23c6dd286435b32c55683e1919979b295b301ddf`（2026-07-02），远端树只有 `README.md`；因此当前工作树的 Network/URRF/Relay 源码仍是本地真实依据，不把远端叙事当成实现证据。

本机事实也保持边界：Android 设备列表只有 `emulator-5554`（Android ATD x86_64，API 35），没有物理设备或第二网络。历史 DuoWorld donor 的 `node --check public_relay/relay_server.js`、`node --check gateway/relay_bridge.js`、`node tests/public_relay_test.js`（`PUBLIC_RELAY_PROTOCOL_PASS`）和 `node tests/gateway_relay_bridge_test.js`（`GATEWAY_RELAY_BRIDGE_PASS`）本轮重新通过；这些仍是本机协议/bridge candidate，不是公网部署、TLS、NAT、跨节点 authority 或 SLA 证据。其 `LICENSE_AUDIT.md` 仍明确为 `METADATA_INVENTORY_COMPLETE_NOT_LEGAL_CLEARANCE`，项目 `private: true`、无根 `LICENSE`，不产生复制或发布授权。

因此当前 blocker 不是缺少可读源码，而是 canonical external transport、donor/实现许可、TLS/key custody 及 relay/leader/lease/failover authority 的 owner 决策。完成这三个裁决前，安全的下一步仍然是保留 URRF semantic seam、Loopback/HTTP candidate 和负证据，不新增物理 Provider 或平行 socket/relay 语义。

## 2026-09-10 DML Remote Link 本地资产复核

本轮又检查了 RNCS 当前提交树中被 sparse checkout 隐藏的 `packages/host/dml-remote-link`。它不是外部陌生 donor，而是已有的 Apache-2.0 控制面资产；为避免只引用历史状态，临时物化该路径后在当前工作树重跑 `npm.cmd test --workspace @taowind/dml-remote-link`，结果为 `6 tests / 6 pass / 0 fail / 0 skip`，随后恢复原 sparse checkout。完整账本为 `docs/verification/RNCS_DML_REMOTE_LINK_LOCAL_EVIDENCE_v0.1.json`。

它实际闭合的是：一次性浏览器连接码 → P-256 设备公钥 → Ed25519 短期 Grant → HTTP Relay 队列 → 签名 Host 拉取 → 本地 DML Core 执行 → 签名回执 → Projection；同时验证了请求签名绑定、nonce 重放拒绝、设备/Origin/Scope/Risk 限制和 Host Policy 目录边界。这个实现可以作为外部 transport 未来所需的身份、短期授权、重放防护、回执 root 和本地 policy donor。

它不能被提升为 RNCS world transport：当前执行是本机 HTTP/loopback，Relay 状态是本地 JSON 单节点，语义 owner 是 DML action/Workbench projection；它没有 URRF world packet carrier、RSR/VSR replication、WebSocket/UDP/QUIC/WebRTC、TLS listener、跨节点 lease/failover 或真实第二网络/设备证据。Cloudflare Named Tunnel 只是配置自动化模板，不能替代公网部署证明。因此裁决为 `CONTROL_PLANE_DONOR_RETAINED_WORLD_TRANSPORT_NOT_PROMOTED`，不会把 DML action/queue/projection schema 复制成 RNCS 的第二套世界同步语义。
