# RCL 元现实运行平面正式规格 v0.5

## 1. 定位

RCL v0.5 不新增普通业务现实域，而是在九域现实之上增加三条元现实运行平面：

1. **元时间空间现实（Meta-Spacetime Reality）**
2. **元加速现实（Meta-Acceleration Reality）**
3. **元压缩现实（Meta-Compression Reality）**

它们不负责描述某一种对象，而负责改变所有现实如何被定位、运行和表达。

---

## 2. 元时间空间现实

### 2.1 核心问题

> 一个状态或事件在什么参考系、什么位置、什么时刻成立；不同事件如何同步并保持因果次序？

### 2.2 一级结构

- `frame`：参考系、维度与拓扑；
- `clock`：逻辑或物理时钟、tick 与 rate；
- `coordinate`：绑定对象的时空点；
- `relation`：`before / after / simultaneous` 因果关系；
- `synchronize`：推进时钟并同步坐标。

### 2.3 示例

```rcl
spacetime chronos {
  frame world dimensions 3 topology "euclidean"
  clock simulation : Time = seconds(0) tick seconds(1) rate 2
  coordinate lamp = point("world", meters(1), meters(2), meters(3), seconds(0))
    target "greenhouse.light"
    clock simulation
  relation request before calculation
  preserve chronos.simulation >= seconds(0)
}

synchronize chronos steps 3
```

执行后：

```text
chronos.simulation = 6s
chronos.lamp.t = 6s
```

运行时会拒绝因果环：

```text
a before b
b before a
```

---

## 3. 元加速现实

### 3.1 核心问题

> 如何改变计算、推演与执行速度，同时不偷换结果、不越过权限、不破坏现实等价性？

### 3.2 一级结构

- `target`：被加速的 RCL 计算；
- `strategy`：加速方法；
- `factor`：目标加速等级；
- `budget`：时间预算；
- `fidelity`：允许保留的结果忠实度；
- `accelerate`：激活加速策略。

### 3.3 v0.5 参考实现

当前只实现：

```text
strategy memoize
fidelity 1
```

即：对纯结果按“参数＋当前现实根”进行精确记忆化，不允许低忠实度近似冒充精确结果。

```rcl
acceleration fast_fib {
  target fib
  strategy memoize
  factor 8
  budget seconds(1)
  fidelity 1
  evidence "optimization:memoization"
}

accelerate fast_fib
```

参考测试中 `fib(24)`：

```text
requests    = 48
evaluations = 25
cacheHits   = 23
result      = 46368
```

---

## 4. 元压缩现实

### 4.1 核心问题

> 如何用更少的信息载体保存现实，同时明确哪些意义必须保留、能否恢复、恢复后是否仍是同一个现实？

### 4.2 一级结构

- `target`：待压缩状态命名空间；
- `mode`：压缩语义；
- `codec`：编码器；
- `reversible`：是否允许恢复；
- `discard`：压缩后是否从活动状态移除原对象；
- `fidelity`：意义保真度；
- `max_ratio`：最大允许压缩率；
- `compress / restore`：压缩与恢复。

### 4.3 v0.5 参考实现

当前只实现：

```text
mode lossless
codec deflate
fidelity 1
```

压缩胶囊携带：

- 原始 reality root；
- 原始与压缩字节数；
- 压缩比；
- 目标键集合；
- 证据；
- 可逆性；
- 编码载荷。

恢复时必须重新计算根并与原始根一致，否则拒绝恢复。

```rcl
compression memory_capsule {
  target memory
  mode lossless
  codec deflate
  reversible true
  discard true
  fidelity 1
  max_ratio 0.8
  evidence "snapshot:memory"
}

compress memory_capsule
restore memory_capsule
```

---

## 5. 三条元现实之间的关系

```text
元时间空间现实
  决定变化在哪里、何时、按什么因果顺序发生

元加速现实
  决定同一变化如何更快完成，同时保持结果契约

元压缩现实
  决定同一现实如何以更少结构保存、迁移和恢复
```

统一表达：

```text
RealityMetaTransform =
  locate(reality)
  + schedule(reality)
  + compress(representation)
  + preserve(identity, causality, evidence, authority)
```

---

## 6. 权界边界

三条元现实不能绕开原有权界：

- 时间加速不能跳过授权和关键审批；
- 压缩不能删除责任链、来源或不可替代证据；
- 同步不能把未来状态伪装成当前正式现实；
- 近似计算不能标记为精确计算；
- 恢复后的现实根必须可验证。

---

## 7. 当前诚实边界

v0.5 仍未实现：

- 相对论或曲率时空模拟；
- 分布式物理时钟共识；
- 自动并行调度；
- GPU / SIMD / 多节点实际编译优化；
- 有损语义压缩；
- 跨版本知识压缩与意义重建；
- 自托管 RCL VM。

本版完成的是可执行、可验证的元现实语义地基，而不是宣称解决全部时空、加速和压缩问题。
