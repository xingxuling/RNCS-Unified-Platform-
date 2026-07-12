# 03｜HNAF 与 Reality One Gateway 接入

## HNAF

`integration/hnaf/digital-blue-tianji-workbench.aip.v0.7.json` 将发送、暂停、继续、检查结果、采用、放弃和换方案表达为目标能力，而不是固定函数。

## Gateway

DML 作为 `rncs.dml-core` Runtime 被动态发现。注册脚本只增加 Runtime Manifest，不修改 Gateway 中央代码。

## 传输

当前使用 stdio 作为 Gateway 本地传输。未来可以替换为原生 Node Module、远程 Provider 或设备宿主，Workbench 语义不变。
