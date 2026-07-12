# RCL v0.4 认知运行平面正式规格

## 1. 定位

RCL v0.4 保持九个一级现实域不变，新增三个由既有现实域组合而成的运行平面：

1. Natural Language Reality（自然语言现实）
2. Understanding Reality（理解现实）
3. Creative Reality（创造现实）

三者不是第十、十一、十二现实域。它们是主体在运行期间把符号转化为意义、把证据组织为解释、把理解转化为候选新结构的复合平面。

```text
九域现实
  ↓
自然语言现实：符号 → 候选意图
  ↓
理解现实：证据与知识 → 可检验世界模型
  ↓
创造现实：理解与约束 → 多个候选结构 → 选优
  ↓
权界裁决
  ↓
执行现实：候选变化 → 正式变化
```

## 2. 不变量

### 2.1 自然语言不等于真理

一段文本只能形成 `Utterance`。解释规则可以形成 `Intent`，但意图必须携带：

- 是否激活；
- 动作；
- 目标；
- 置信度；
- 来源话语；
- 槽位；
- 证据。

自然语言平面不能直接改变外部现实。

### 2.2 理解不等于知识复制

Knowledge Reality 保存“什么主张有理由成立”。Understanding Reality 负责“这些主张和观测共同说明了什么”。

一个理解对象必须保留：

- 类型化结论；
- 解释文本；
- 依赖对象；
- 证据链；
- 置信度；
- 覆盖率；
- 一致性；
- 状态。

理解必须可以被低置信度、低一致性或后续矛盾否决。

### 2.3 创造不等于随机输出

Creative Reality 生成的是候选结构，而不是自动执行的结果。每个候选必须具有：

- 类型化内容；
- 激活条件；
- 目标；
- 新颖度；
- 效用；
- 可行性；
- 风险；
- 证据与来源理解；
- 综合分数。

参考运行时采用：

```text
score = utility × 0.45
      + feasibility × 0.30
      + novelty × 0.15
      + (1 - risk) × 0.10
```

选中只表示“当前候选集中最值得进入下一阶段”，不表示已获执行权限。

## 3. 自然语言现实语法

```rcl
language command {
  utterance request = "请打开温室灯"
    speaker "operator"
    locale "zh-CN"
    channel "text"
    evidence "input:user-request"

  intent activate_light
    when contains(utterance_text(command.request), "打开")
      and contains(utterance_text(command.request), "灯")
    action "activate"
    target "greenhouse.light"
    confidence 0.97
    evidence "grammar:zh-open-light"
    from command.request
    slot device = "light"

  preserve intent_confidence(command.activate_light) >= 0.90
}

interpret command
```

核心类型：

- `Utterance`
- `Intent`

核心函数：

- `utterance_text`
- `utterance_speaker`
- `utterance_locale`
- `intent_name`
- `intent_action`
- `intent_target`
- `intent_confidence`
- `intent_matches`
- `contains`
- `starts_with`
- `ends_with`
- `lower_text`
- `upper_text`

## 4. 理解现实语法

```rcl
understanding situation {
  hypothesis authorized_request : Truth =
    intent_matches(command.activate_light, "activate", "greenhouse.light")
    and knowledge_value(mind.operation_safe)

    confidence 0.96
    explanation "请求要求开灯，且安全知识允许该操作。"
    evidence "model:command-plus-safety"
    from command.activate_light, mind.operation_safe
    coverage 1.0
    coherence 0.98

  preserve understood(situation.authorized_request, 0.90)
}

understand situation
```

核心类型：

```text
Understand<T>
```

核心函数：

- `understanding_value`
- `understanding_confidence`
- `understanding_coverage`
- `understanding_coherence`
- `understanding_explanation`
- `understood`

依赖对象必须属于可携带证据的现实对象，例如 Measurement、Knowledge、Utterance、Intent、Understanding 或 Creation。

## 5. 创造现实语法

```rcl
creation solutions {
  candidate activate : Text = "activate"
    when understanding_value(situation.authorized_request)
    target "greenhouse.light"
    novelty 0.30
    utility 0.98
    feasibility 0.99
    risk 0.02
    evidence "strategy:direct-safe-action"
    based_on situation.authorized_request

  candidate clarify : Text = "ask-for-clarification"
    when true
    target "operator"
    novelty 0.20
    utility 0.25
    feasibility 1.0
    risk 0.01

  select chosen from activate, clarify
  preserve creation_score(solutions.chosen) >= 0.80
}

create solutions
```

核心类型：

```text
Create<T>
```

核心函数：

- `creation_value`
- `creation_score`
- `creation_novelty`
- `creation_utility`
- `creation_feasibility`
- `creation_risk`
- `creation_target`
- `selected`

## 6. 与内在现实和执行现实的关系

### 内在现实 v0.2

```text
Perception
+ Neural
+ Living
+ Knowledge
+ Natural Language
+ Understanding
+ Creative
= Inner Reality
```

### 执行现实 v0.2

创造平面选中的候选仍必须经过：

```text
foresee
→ warrant / needs
→ preserve
→ realize
→ witness / receipt
```

自然语言、理解和创造都不能绕过 AAF/RFE 对应的权界与正式提交语义。

## 7. 少数据智能意义

该结构允许基础智能依赖：

```text
显式语言规则
+ 九域先验结构
+ 少量观测
+ 知识证据
+ 理解模型
+ 候选创造
+ 执行反馈
```

在有限、规则明确的环境中，可不依赖 LLM 完成语言命令理解、解释、方案生成、风险筛选和行动。开放世界自然语言、隐喻、长上下文、图像和声音仍可由 LLM 或专用模型作为 Provider 提供候选解释，但其输出必须进入 RCL 的置信度、证据、理解、创造与权界链。

## 8. 当前边界

v0.4 尚未实现：

- 统计分词与通用语法学习；
- 任意自然语言理解；
- 语义歧义自动消解；
- 类比、隐喻和长期对话语用；
- 约束求解式组合创造；
- 创意族谱与结构变异；
- 理解模型的自动反证搜索；
- 原生字节码和分布式认知运行时。

这些能力应继续建立在当前三个平面上，而不是重新把大模型输出当作不可审计的最终现实。
