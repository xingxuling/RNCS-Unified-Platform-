# 渲染系统命名边界反演报告 v0.2

## 异常

传统渲染系统通常围绕 Draw Call、Shader、Texture、Pass 和 Framebuffer 组织。它们回答“怎样画得更快”，但不天然回答：

- 谁正在观察？
- 哪些信息对这个主体有权限和意义？
- 低端手机与高端桌面是否仍在看同一个现实？
- 质量降级是否偷偷删除了关键事实？
- 最终画面能否追溯到权威状态和执行计划？

## 矛盾

“像素一致”不等于“意义一致”；“同一场景文件”也不等于“同一观察者现实”。传统引擎常把观察者、设备预算、材质、光照与后处理分散在多个系统中，最后只能用截图和性能分析器间接解释结果。

## 本质

渲染不是画图，而是：

> 在不改变来源现实的前提下，把主体有权看见且当前任务相关的状态，编译成设备可承担的感知结果，并留下可验证证据。

因此定义：

```text
Visual Reality Compilation
= Source Reality
+ Observer Purpose
+ Device Budget
+ Visibility
+ Material / Light Semantics
+ Ordered Batches
+ Render Graph
+ Resource Lifetime
+ Backend Plan
+ Perceptual Equivalence
+ Evidence
```

## 生活例子

同一场足球赛：

- 观众看到比分、球员和精彩镜头；
- 教练看到跑位、体能和战术区域；
- 裁判看到越位线和犯规证据；
- 手机用户降低阴影和粒子，但不能把进球删掉。

四种画面不同，但比赛事实必须相同。这就是观察者相对投影，而不是四个互相矛盾的世界。

## 新边界

VSR v0.2 将 DisplayState 继续编译为：

- 可见性记录；
- 顺序安全批次；
- 材质分配；
- 分块灯光列表；
- Render Pass DAG；
- 临时资源生命周期与别名组；
- WGSL 模块计划；
- WebGPU / Hybrid 兼容计划；
- 语义不变量；
- Plan Root、Evidence Root 与 Pixel Root。

## 反证条件

如果质量降级会删除非装饰语义、批处理改变遮挡顺序、不同设备无法证明来源现实一致，或 Render Graph 只是文档而不能运行参考输出，则反演失败。
