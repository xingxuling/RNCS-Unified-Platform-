# Source integrity boundary

本分支提交的是 v0.18.1 的可审查核心源码、测试、Godot 客户端、验收报告和完整交付包校验值。

由于当前 GitHub 连接不提供 Release Asset 或大型目录批量上传接口，且 TaoWind Developer Execution Worker 尚未配置，26MB、7,681 文件的完整 ZIP 没有伪装成已上传。

`packages/world/open-world-rpg-runtime/src/index.mjs` 是为连接器提交限制制作的等价紧凑镜像，保留公开协议和测试覆盖，并重新通过 14/14 测试；完整原始文件仍以 ZIP 及其 SHA-256 为权威交付。

完整 ZIP SHA-256：`5a9be548349b644410a75b869695af5c290649de7915134949d8964a4046efc9`。
