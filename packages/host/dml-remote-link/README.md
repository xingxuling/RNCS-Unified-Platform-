# DML Remote Link v0.3.0-alpha.1

数字蓝天机 Workbench 与本机 DML Core Runtime 之间的安全远程连接层。

## 这版解决了什么

v0.2 已经跑通：

```text
Lovable → Secure Relay → 本机 Host → DML Core → 现实投影
```

v0.3 解决了上一版最大的公网风险：**不再把长期 browser token 写入 Lovable/Vite 构建产物**。

浏览器身份改为：

```text
一次性 12 位连接码
→ 浏览器生成 P-256 设备密钥
→ Relay 保存公钥
→ 签发约 10 分钟有效的短期 Grant
→ 到期后由不可导出的浏览器私钥签名续期
→ Relay 主机可随时撤销设备
```

## 已实现

- 一次性 Browser 登录码，默认 10–15 分钟过期；
- 浏览器设备注册与撤销；
- P-256 浏览器设备签名；
- Ed25519 Relay Grant 签发与验证；
- Grant 的 Origin、Scope、Risk Limit、Session 和过期时间约束；
- Grant 过期后 SSE 自动断开并由工作台刷新；
- 静态旧 browser token 默认禁用；
- 一次性 Host 配对；
- Relay / Host 双 Ed25519 签名；
- Host 与 Browser 请求 nonce 重放拒绝；
- Semantic Action 队列与本机 DML Core 真实执行；
- 幂等执行回执、Projection 与 SSE；
- CORS 白名单、限流和 1 MiB 请求体上限；
- Cloudflare Named Tunnel 配置脚本；
- Windows 一键启动完整远程链与登录自启动任务。

## 快速验证

```bash
npm install
npm test
npm run demo
npm run verify
```

## 本地完整运行

### 1. 创建会话

```bash
node src/relay/cli.mjs create-session \
  --state state/relay \
  --name "数字蓝天机"
```

保存输出的：

- `session_id`
- `browser_login_code`
- `pair_code`

连接码和配对码都只显示一次。

### 2. 启动 Relay

```bash
node src/relay/cli.mjs serve \
  --host 127.0.0.1 \
  --port 17901 \
  --origins https://你的工作台域名 \
  --state state/relay
```

### 3. 配对本机 Host

```bash
node src/host/cli.mjs pair \
  --relay http://127.0.0.1:17901 \
  --session '<session_id>' \
  --code '<pair_code>' \
  --allow-http \
  --state state/host
```

### 4. 配置本机能力边界

编辑：

```text
config/host-policy.example.json
```

只映射数字蓝天机真正允许操作的项目目录，不要开放整个磁盘。

### 5. 启动 Host

```bash
node src/host/cli.mjs run \
  --state state/host \
  --policy config/host-policy.example.json
```

## Cloudflare Named Tunnel

Windows 双击：

```text
配置Cloudflare命名隧道.bat
```

脚本将执行：

1. 检查 `cloudflared`；
2. 首次运行时打开 Cloudflare 登录授权；
3. 创建或复用命名 Tunnel；
4. 创建固定域名 DNS 路由；
5. 生成 `config/cloudflared-config.yml`；
6. 将域名转发到 `127.0.0.1:17901`。

随后双击：

```text
启动完整远程链.bat
```

它会依次启动 Relay、Local Host 和 Cloudflare Tunnel。

需要登录 Windows 后自动启动时，再双击：

```text
安装远程链登录自启动.bat
```

Cloudflare 账号授权和域名选择必须由账号持有人在本机完成，软件包不会索取或保存 Cloudflare 密码。

## Lovable 配置

只需要一个公开环境变量：

```env
VITE_DML_RUNTIME_URL=https://relay.example.com/v1/sessions/<session_id>
VITE_DML_AUTH_MODE=device
```

**不再配置 `VITE_DML_SESSION_TOKEN`。**

首次打开工作台时，界面会要求输入一次性连接码。新码可在 Relay 主机运行：

```bash
node src/relay/cli.mjs create-login-code \
  --session '<session_id>' \
  --state state/relay \
  --label '我的浏览器'
```

查看与撤销浏览器设备：

```bash
node src/relay/cli.mjs devices --session '<session_id>' --state state/relay
node src/relay/cli.mjs revoke-device --session '<session_id>' --device '<device_id>' --state state/relay
```

## Windows 最简使用

首次配置只需双击：

```text
首次配置数字蓝天机远程链.bat
```

向导将自动完成或引导完成：

1. 安装或检查 `cloudflared`；
2. 登录 Cloudflare；
3. 创建固定命名 Tunnel 与 DNS 路由；
4. 创建 DML 会话；
5. 启动 Relay 与 Tunnel；
6. 配对并启动本机 DML Host；
7. 输出 Lovable 运行地址和首次浏览器连接码。

随后在 Lovable 只设置：

```env
VITE_DML_RUNTIME_URL=https://你的中继域名/v1/sessions/<session_id>
VITE_DML_AUTH_MODE=device
```

后续开机运行：

```text
启动完整远程链.bat
```

新增浏览器：

1. 双击 `生成浏览器连接码.bat`；
2. 在新浏览器输入一次性连接码。

## 目录

```text
src/shared       签名、Grant、哈希与协议
src/relay        登录码、设备、短期授权、队列、Projection 与 SSE
src/host         配对、本机策略、DML Core 执行
vendor           DML Core Runtime v0.1.0-alpha.1
config           Host Policy、Cloudflare 与部署样例
scripts          演示、验证、Tunnel 和 Windows 自启动
research         预留
models           预留
docs             架构、协议和接入说明
tests            安全与端到端测试
```

## 真实性边界

本版是可运行的单节点 Alpha，不等于成熟身份平台或云集群：

- Relay 仍使用本地 JSON 状态文件；
- 浏览器设备密钥降低长期凭证泄露风险，但不能抵御网页本身遭遇的实时 XSS 控制；
- Cloudflare Tunnel 提供公网传输与固定入口，但 DML 的权威判断仍由 Grant、AAF 和 Host Policy 完成；
- 高风险设备、机器人、金融、医疗和神经动作仍需要专门安全系统与专业认证。
