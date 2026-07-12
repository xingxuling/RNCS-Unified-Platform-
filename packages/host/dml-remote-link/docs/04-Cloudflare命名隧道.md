# Cloudflare Named Tunnel 部署

## 为什么必须是命名 Tunnel

数字蓝天机依赖长连接事件流。临时 Quick Tunnel 只适合短期测试，不应承担正式 DML 远程链。命名 Tunnel 提供稳定域名、可重复启动和 DNS 路由。

## Windows 自动配置

直接双击。脚本会优先检查 `cloudflared`；缺失时尝试通过 Windows `winget` 自动安装：

```text
配置Cloudflare命名隧道.bat
```

脚本会：

- 调用 `cloudflared tunnel login`；
- 创建 `dml-blue-tianji` 命名 Tunnel；
- 创建固定 hostname 的 DNS 路由；
- 生成 `config/cloudflared-config.yml`；
- 将公网 hostname 转发至 `http://127.0.0.1:17901`。

生成后的配置结构：

```yaml
tunnel: <TUNNEL_ID>
credentials-file: C:/Users/<USER>/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: relay.example.com
    service: http://127.0.0.1:17901
  - service: http_status:404
```

## 启动

```text
启动完整远程链.bat
```

或者手动：

```powershell
cloudflared tunnel --config config/cloudflared-config.yml run
```

## 健康检查

```text
https://relay.example.com/health
```

预期返回：

```json
{
  "status": "ok",
  "protocol": "dml.secure-relay.v0.3"
}
```

## 安全边界

Tunnel 只解决 HTTPS 公网传输，不替代 DML 权威层：

- Origin 必须加入 Relay CORS 白名单；
- 浏览器必须通过一次性连接码和设备密钥；
- Semantic Action 仍受 Grant Scope 与 Risk Limit 约束；
- 本机动作仍受 AAF、DML Core 和 Host Policy 约束。

## 一次完成首次部署

更推荐直接运行：

```text
首次配置数字蓝天机远程链.bat
```

它会在 Cloudflare 登录完成后继续创建 DML 会话、启动 Relay/Tunnel、配对本机 Host，并生成 `config/remote-stack.json`。该文件只保存运行地址、Session ID 和 Origin，不保存一次性连接码或长期私钥。
