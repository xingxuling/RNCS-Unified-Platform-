# VSR Dependency Graph 与增量求值

## 目标

在保持任意时间直接求值和确定性的前提下，避免静态节点每帧重复执行表达式、绑定和轨道归约。

## 预处理索引

`prepareDocument()` 为每个节点收集：

- 基础属性中的 binding/expression；
- Track binding/expression；
- Keyframe 与 active time；
- 响应式布局与相对长度；
- 父子后代关系。

生成：

```ts
interface VSRDependencyGraph {
  variableToNodes: Map<string, Set<string>>;
  contextToNodes: Map<string, Set<string>>;
  inputToNodes: Map<string, Set<string>>;
  timeDependentNodes: Set<string>;
  layoutDependentNodes: Set<string>;
  descendantsByNode: Map<string, Set<string>>;
}
```

## 失效规则

每次 Session 求值比较：

- 上一次与当前的顶层变量语义哈希；
- viewport、DPR、locale、fps；
- input 顶层字段；
- time；
- runtime override；
- documentHash。

命中依赖后将节点标脏，并向后代扩散，避免父级 transform/layout 变化后错误复用子级。

## 当前缓存层级

已缓存：节点解析后的属性对象。

尚未缓存：

- Layout result；
- world matrix；
- DisplayItem；
- DisplayState branch hash；
- 后端绘制命令或像素 tile。

因此 alpha.2 是“增量求值第一阶段”。
