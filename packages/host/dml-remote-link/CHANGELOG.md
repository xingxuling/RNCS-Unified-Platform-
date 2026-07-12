# Changelog

## v0.3.0-alpha.1

- 删除新会话长期 `browser_token`；
- 新增一次性 12 位 Browser 连接码；
- 新增 P-256 浏览器设备注册、签名刷新和撤销；
- 新增 Ed25519 短期 Browser Grant；
- 新增 Grant Scope、Risk Limit、Origin 与 Session 约束；
- Grant 过期时主动关闭 SSE，允许客户端续期重连；
- 新增 `create-login-code`、`devices`、`revoke-device` CLI；
- 新增 Cloudflare Named Tunnel 配置和 Windows 自启动脚本；
- 工作台移除 `VITE_DML_SESSION_TOKEN`，改为一次性连接界面。

## v0.2.0-alpha.1

- 首次实现 Secure Relay、本机 Host、双签名、动作队列、DML Core 执行与 Projection。

- 新增 `首次配置数字蓝天机远程链.bat` 一体化部署向导。
- `cloudflared` 缺失时尝试通过 winget 自动安装。
- 远程运行参数写入本地 `config/remote-stack.json`，不保存一次性连接码和设备私钥。
- Lovable Workbench 完成生产构建验证。
