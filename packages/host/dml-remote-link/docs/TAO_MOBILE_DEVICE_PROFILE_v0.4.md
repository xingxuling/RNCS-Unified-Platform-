# Tao Mobile OS × DML Device Host v0.4

Tao Mobile OS 使用 `create-mobile-login-code` 注册 P-256 设备身份并取得短期 Grant。Grant 允许请求 `dml.read / dml.goal.* / dml.device.*`，但 **不等于电脑本机执行授权**。

电脑端 `host-policy` 必须显式映射：
- `allowed_apps`：app_id → executable/args/cwd；
- `command_profiles`：profile_id → executable/args/cwd/timeout；
- `allow_process_list`；
- `allow_open_url`。

模型不得直接给出 executable、PowerShell/bash 字符串并绕过 profile。每个远程动作仍走 Relay 签名队列、Host Policy、执行 Receipt 和 Projection。

设备状态 Projection v0.4 包含 CPU 差分采样、内存、存储、网络接口、平台与运行时 uptime；实时状态问答必须使用该 Projection，而不是模型推测。
