# 跨环境交付计划

## 已完成：源码与离线运行包

- MCP 版本升级至 `0.2.0-alpha.1`；
- 母工程升级至 `0.13.0-alpha.1`；
- 默认权限改为 `founder`；
- 工具目录从 15 个扩展至 27 个；
- 修复列表型 `structuredContent` 顶层数组兼容问题；
- 完成本地安装、测试、Smoke、健康和打包校验。

## 待部署：远程 GitHub/Vercel 实例

当前 ChatGPT 已连接的远程实例仍是 `0.1.1-alpha.3`。离线源码交付不会自动替换远程进程。部署端需要执行：

1. 用本交付包覆盖目标仓库对应 MCP 包；
2. 保留或重新配置私有路径 Token；
3. 设置 `TAOWIND_MCP_AUTHORITY_MODE=founder`；
4. 设置 `TAOWIND_MCP_ENABLE_AUTHORITY_WRITES=true`；
5. 设置创始人主体与角色；
6. 重新构建并部署；
7. 在 ChatGPT 中刷新工具目录；
8. 以 `taowind_server_info` 和 `rncs_list_runtimes` 做远端验收。

## 远端验收锚点

```json
{
  "version": "0.2.0-alpha.1",
  "authority_profile": "founder-authority",
  "tool_count": 27
}
```

列表工具必须返回对象，正式工作流必须产生新的 Revision/Generation，且旧状态根前置条件必须被拒绝。
