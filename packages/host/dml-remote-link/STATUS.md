# DML Remote Link 状态

- 版本：v0.3.0-alpha.1
- 日期：2026-07-01
- 状态：Alpha Verified
- 协议：`dml.secure-relay.v0.3`
- 浏览器身份：一次性连接码 + P-256 设备密钥 + Ed25519 短期 Grant
- 本机执行：DML Core Runtime v0.1.0-alpha.1 + HNAC/HNAF Execution Fabric v0.8.0
- 公网入口：Cloudflare Named Tunnel 自动配置模板
- Windows：首次配置向导、完整链启动、登录自启动
- 自动测试：6/6 PASS
- 端到端闭环：PASS
- Lovable Workbench CI：测试与生产构建 PASS
- Workbench 主分支：`9872ed96d2f7ce0cc1ef66f19eb2d1562aad84c0`

## 仍需用户完成

Cloudflare 账号登录、真实域名授权与 Lovable 环境变量设置必须由账号持有人完成；发布包不会索取或保存 Cloudflare 密码。
