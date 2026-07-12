# Behavior Native Studio Contract v0.8

## Project domain

`project.behavior` 必须包含：

- `active_program_id`
- `programs`
- `bindings`
- `editor`
- `trace_refs`

## Session contract

行为会话必须支持：

- inspect
- step
- run
- pause / resume / reset
- snapshot / restore
- hot reload
- patch
- undo / redo
- breakpoint add / remove
- artifact export

## Invariants

1. 编辑后的程序必须重新产生 Program Root。
2. 无效程序不得进入运行时。
3. 热更新必须明确记录保留的实体与状态机数量。
4. Snapshot 必须与 Program Root 匹配。
5. VSR 玩家投影和调试投影必须共享同一 State Root。
6. 行为变化只形成 RFE candidate delta，不能绕过权威提交。
