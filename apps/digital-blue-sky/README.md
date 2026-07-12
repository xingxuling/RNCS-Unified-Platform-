# DML Cognitive Runtime v0.5.0-alpha.1

DML v0.5 在真实任务执行内核之前加入认知层，使普通问题可以回答，项目问题可以读取事实，明确任务才进入执行。

## 核心路径

```text
消息 → 分类 → 记忆 → 只读工具 → 回答 / 澄清 / 任务 → 真实执行内核
```

## Provider

- 本机 Ollama；
- OpenAI 兼容 `/chat/completions`；
- 无模型时的有限内置状态回答。

## 认知工具

- `task.status`
- `project.summary`
- `project.search`
- `file.read`
- `capability.status`
- `memory.recall`

这些工具只读。修改文件、运行命令和采用候选仍由任务内核和审批边界控制。

## 启动

```bash
npm test
npm run serve
```

默认地址：`http://127.0.0.1:17801`
