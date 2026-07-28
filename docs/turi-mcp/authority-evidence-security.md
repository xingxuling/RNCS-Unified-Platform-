# Authority、Evidence 与安全边界

## 四档执行模式

| 模式 | 默认状态 | 例子 |
| --- | --- | --- |
| `read_only` | 开启 | status、search、describe、history |
| `candidate` | 默认开启 | compile、candidate branch、simulate、UPDIA think、记忆候选 |
| `authorized_write` | 关闭 | AAF authorize、Native RGR commit、behavior enable、能力晋升 |
| `external_effect` | 关闭 | formal merge、rollback、push、PR、deploy |

`authorized_write` 要求 `TURI_AUTHORITY_MODE=authorized`、`TURI_ENABLE_AUTHORIZED_WRITES=true` 和匹配的 `TURI_AUTHORITY_TOKEN`。`external_effect` 还要求 `TURI_ENABLE_EXTERNAL_EFFECTS=true`。HTTP 远程部署必须使用至少 24 字符 Bearer token，并设置 Host/Origin allow-list。

## EvidenceReceipt

每次调用记录能力 ID、implementation、execution grade、input/output hash、候选 ID、state root、revision、generation、artifact、warning、limitation 和 rollback reference。`RUNTIME_VERIFIED` 只在真实执行并满足相应不变量时产生；`STATIC_VERIFIED` 不等于运行时成功。

候选执行的核心断言是：

```text
worldStatus.before.state_root == worldStatus.after.state_root
worldStatus.before.revision  == worldStatus.after.revision
```

## 文件与进程安全

- 所有 workspace/seed 路径必须 confined 到配置根目录，拒绝 traversal、敏感文件和 symlink escape。
- 没有 shell/eval 任意入口；runtime action 必须先在发现的 manifest 中声明。
- 输出超限转存为 TURI artifact，服务响应只返回 metadata/summary。
- job、receipt、artifact ID 在 Windows 上写盘前会把 `:` 等非法文件名字符转义。
- UPDIA/GameBrain 子进程有固定 executable、cwd、超时、stderr 截断和 JSONL 响应匹配。
