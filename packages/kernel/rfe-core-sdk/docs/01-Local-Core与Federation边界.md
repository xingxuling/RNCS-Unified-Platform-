# Local Core 与 Federation Bridge

## Local Core

负责单机或单权威域中的身份、事实、关系、事件、事务、Generation、Branch、Diff、Merge和Evidence。它可以嵌入桌面应用、服务端、手机宿主或测试环境。

## Federation Bridge

负责把Local Core产生的候选Generation交给RFE C7–C12：复制权威、跨域原子提交、联盟共识、拜占庭安全、分区恢复和宪法拓扑演化。

Local Core不会假装本地文件锁等同于分布式共识。
