# RFE Core SDK 宪法 v0.1

1. **Generation 是唯一权威现实代际。** 查询结果、投影、缓存和宿主快照不能自行宣布现实改变。
2. **提交必须原子化。** 所有操作先在内存候选状态中验证，只有完整合法时才写入新 Generation 并交换分支指针。
3. **历史不可覆盖。** Fact 与 Relation 通过 `validFrom/validTo` 形成时间区间，旧记录保留。
4. **内容按哈希寻址。** 对象、Generation、事件与收据均可独立验证。
5. **本地核心不复制联盟共识。** C7–C12 由 Federation Bridge 承担；普通应用默认只需 Local Core。
6. **RNCS Contract 是跨模块上位转换协议。** SDK输出 Generation Reference，供 Transition Envelope 提交阶段引用。
