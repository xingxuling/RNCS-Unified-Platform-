# Code Review v0.8

## 关键发现与修复

1. 原求解器在每次速度迭代重复执行位置纠正，低速接触可能过度分离；现已拆分位置和速度求解阶段。
2. Warm Start不能直接重放高速撞击的完整冲量；现对持久支撑冲量做上限约束。
3. VSR纹理引用必须在编译前验证，避免材质静默引用不存在资源。
4. 动画采样通过覆盖节点表现Transform实现，`sourceRealityRoot`只绑定RNCS现实，不包含表现时间。
5. glTF导入收据和Frame Plan均具备可复核根。

## 结论

新增路径有自动测试、类型检查、Lint和跨运行时验收；未发现阻断发布的问题。

## 发布前补充审查

- Bridge Sensor判定已从最终帧采样改为逐权威Tick捕获，避免高速穿越漏事件。
- Reality Studio接受v0.5和v0.6空间世界格式，并由迁移器统一到v0.6快照。
- Digital Blue Sky内置VSR阴影Provider已适配v0.7动画字段和UV顶点签名。
- 所有Node CLI入口使用`fileURLToPath`处理中文路径，不再比较编码后的`file://`字符串。
