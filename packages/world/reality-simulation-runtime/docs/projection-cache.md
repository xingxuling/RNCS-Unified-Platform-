# Projection Branch Cache

Alpha.3 将增量边界从“节点属性求值”扩展到“布局与投影”。

## 缓存单位

每个节点缓存 `VSRProjectionSnapshot`：

- `activeVisible`
- `localBounds`
- `worldTransform`
- `opacity`
- `clipStack`
- `item`
- `itemHash`

## 失效规则

1. 依赖变化确定直接脏节点；
2. 父节点变化向下失效全部后代；
3. 任意脏节点向上标记祖先为“包含脏分支”；
4. 不在祖先脏集合中的节点可整棵子树跳过；
5. 祖先本身未脏但含脏后代时，复用祖先快照，只进入变化子分支；
6. 父节点变为不可见时，删除后代快照，防止旧 DisplayItem 泄漏。

## 哈希

Item Hash 与节点投影一同缓存。帧哈希只组合有序 Item Hash 清单与帧级字段，避免重复规范化所有静态 DisplayItem。
