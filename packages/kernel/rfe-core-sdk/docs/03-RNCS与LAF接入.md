# RNCS 与 LAF 接入

`RealityStore.generation_reference()`输出RNCS Generation Reference。LAF Revision只能引用该结果，不能把自己的Revision编号提升为Generation。

推荐链路：

```text
ICAR生成Transition Envelope提案
→ HNAC/RSR产生候选变化
→ RFE Core SDK原子提交
→ 返回Generation Reference与Commit Receipt
→ RNCS Envelope进入committed
→ LAF/VSR/HNAF绑定同一Generation
```
