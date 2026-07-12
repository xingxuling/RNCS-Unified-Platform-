# Lovable 数字蓝天机接入 v0.3

## 环境变量

```env
VITE_DML_RUNTIME_URL=https://relay.example.com/v1/sessions/<session_id>
VITE_DML_AUTH_MODE=device
```

不要再设置静态 `VITE_DML_SESSION_TOKEN`。所有 `VITE_` 变量都会进入浏览器构建结果，不适合保存长期控制凭证。

## 第一次连接

1. Relay 主机运行 `create-session` 或 `create-login-code`；
2. 工作台检测到当前浏览器尚未绑定；
3. 自动弹出“一次性连接码”窗口；
4. 浏览器生成 P-256 密钥对；
5. 私钥以不可导出 CryptoKey 保存到 IndexedDB；
6. Relay 验证一次性码并保存公钥；
7. Relay 签发短期 Grant；
8. 页面重新载入后开始订阅 Projection 和事件流。

## 自动续期

Grant 默认约十分钟有效。到期前后，工作台向 `/auth/refresh` 发送带以下字段的签名请求：

```text
X-DML-Device-ID
X-DML-Timestamp
X-DML-Nonce
X-DML-Device-Signature
```

Relay 验证设备公钥、Origin、时间和 nonce 后签发新 Grant。

## 撤销

Relay 主机可列出设备并撤销：

```bash
node src/relay/cli.mjs devices --session '<session_id>' --state state/relay
node src/relay/cli.mjs revoke-device --session '<session_id>' --device '<device_id>' --state state/relay
```

被撤销设备无法刷新，也无法继续使用尚未过期的 Grant。
