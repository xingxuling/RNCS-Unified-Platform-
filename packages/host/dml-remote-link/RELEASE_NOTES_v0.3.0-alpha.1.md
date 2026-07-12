# DML Remote Link v0.3.0-alpha.1 发布说明

本版将数字蓝天机从“长期 Bearer Token 远程控制”升级为“设备绑定的短期权威授权”。

## 核心变化

```text
旧版：Lovable 构建内长期 token
新版：一次性连接码 → 浏览器设备公钥 → 10 分钟短期 Grant → 设备签名续期
```

长期秘密不再进入 GitHub、Lovable 环境变量或前端构建产物。即使短期 Grant 暂时泄露，也会受到过期时间、Origin、Session、Scope 和 Risk Limit 约束，并且可以通过撤销设备立即失效。

同时加入命名 Cloudflare Tunnel 的自动配置和 Windows 登录自启动脚本。账号授权与域名绑定仍需要 Cloudflare 账号持有人在本机完成。


## 首次部署体验

新增 `首次配置数字蓝天机远程链.bat`：从 Cloudflare 登录、命名 Tunnel、DML 会话、Host 配对到 Lovable 配置输出，统一为一个向导。真实 Cloudflare 账号授权仍由用户在官方登录页完成。
