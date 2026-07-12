# RCL Foundation Closure 正式规格 v0.6

## 1. 定位

RCL v0.6 将第一阶段语言地基收口为 **十四个基础现实域、五个认知运行平面、三个元现实运行平面、两条横向约束轴**。

“地基收口”表示：语言已经具备描述构成、变化、观察、生命、认知、验证、主体承载与运行方式的最小统一框架；不表示现实研究从此不会出现新领域，也不表示意识、医学、量子物理等开放问题已被解决。

## 2. 十四个基础现实域

1. 元计算现实：计算如何检查、改变与生成计算。
2. 计算机现实：符号、程序与机器状态如何执行。
3. 物理现实：物质、场、运动与因果如何演化。
4. 能量现实：变化能力如何储存、传递、转化与耗散。
5. 元素现实：构成单元、属性、键与组合如何形成对象。
6. 感知现实：世界如何成为观察者可获得的经验。
7. 神经现实：信号如何传播、学习、记忆与控制。
8. 身体现实：系统、器官、边界和感觉运动通道如何组成身体。
9. 生命现实：生命如何维持连续性、需求、自主行动与适应。
10. 基因现实：结构如何编码、表达、继承、变异与跨代演化。
11. 量化现实：如何测量、校准、表达误差与置信度。
12. 知识现实：如何形成、推导、修订、冲突与遗忘知识。
13. 科学现实：如何提出可证伪假设、实验、重复并形成结论。
14. 精神现实：身份、意义、价值、目的、情感和意志如何整合为主体相对的精神结构。

## 3. 新增现实域

### 3.1 能量现实

```rcl
energy grid {
  reservoir source : Energy = joules(100)
  reservoir load : Energy = joules(0)
  flow charge from source to load amount joules(40)
    efficiency 0.9
    evidence "meter:grid-transfer"
  preserve grid.source >= joules(0)
}
energize grid
```

语义：源储能减少完整输入量；目标得到输入量乘效率；差值记录为耗散。运行时拒绝负储能、超额抽取以及不在 `[0,1]` 的效率。

### 3.2 元素现实

```rcl
element matter {
  species hydrogen { symbol "H" atomic 1 mass 1.008 charge 0 phase "gas" }
  species oxygen { symbol "O" atomic 8 mass 15.999 charge 0 phase "gas" }
  compound water {
    component hydrogen 2
    component oxygen 1
    bond "covalent"
  }
}
constitute matter
```

元素现实不只代表化学元素，也提供“基础构成单元—属性—组合—键”的一般结构。v0.6 参考运行时首先实现原子物种与化合物组合。

### 3.3 科学现实

```rcl
science lab {
  hypothesis delivered : Truth = grid.load >= joules(35)
    confidence 0.95 evidence "hypothesis"
  experiment replication tests delivered
    repeats 3 tolerance 0 method "deterministic-replay"
  conclude accepted from delivered confidence 0.95
  preserve reproducible(lab.replication)
}
investigate lab
```

科学现实与知识现实的区别：知识可以来自观察、规则和推理；科学结论还必须显式保留假设、方法、重复次数、可复现性与可证伪状态。

### 3.4 身体现实

```rcl
embodiment vessel {
  facet vitality : Number = 1
  system metabolism { facet reserve : Energy = joules(80) }
  organ core { facet integrity : Number = 1 }
  bind energy grid
  bind element matter.water
  maintain vessel.vitality >= 0.8
}
embody vessel
```

身体不等于生命，也不等于物理对象。身体是多个物理、能量、感知、神经和生命系统被整合成一个可维持边界的载体。

### 3.5 精神现实

```rcl
spirit mind {
  facet identity : Text = "Aster"
  value autonomy : Number = 1 weight 1
  purpose sustain : Truth = true priority 0.9
  affect calm : Number = 0.8 intensity 0.7
  preserve mind.value.autonomy >= 0.5
}
integrate mind
```

精神现实在 v0.6 中是可操作结构：身份、价值、目的、情感、意义与意志的整合。它不把神经活动直接等同于精神，也不声称该结构证明主观意识或超自然实体存在。

## 4. 三组关键边界

- 物理现实描述演化规律；能量现实描述变化预算与流；元素现实描述构成。
- 神经现实描述信号机制；身体现实描述载体整合；生命现实描述自维持；精神现实描述主体意义结构。
- 知识现实描述“什么被认为成立”；科学现实描述“结论如何通过方法和重复获得更强证成”。

## 5. 运行顺序

参考闭环：

```text
元素构成
→ 身体形成
→ 能量流动
→ 物理与生命演化
→ 感知和神经处理
→ 精神形成价值与目的
→ 知识形成
→ 科学验证
→ 权界裁决
→ 执行现实
```

时间空间、加速与压缩元平面可以作用于上述所有阶段。

## 6. 当前边界

v0.6 不是高保真化学引擎、生物医学仿真器、意识模型或完整科学发现系统。当前实现是确定性的参考语义内核，用于验证各现实域是否能共享类型、状态、证据、因果与权界协议。
