# Living Artifact Format v1.0.0

现实原生计算栈的统一语义对象标准。

## 核心变化

- 合并LAR 0.7、LAF 0.9与LAFPKG-1.0方言。
- 明确Revision、HNAC Snapshot与RFE Generation三级连续性。
- 与RNCS Reality Transition Envelope原生对齐。
- 提供Python与Node确定性验证实现。
- 提供旧LAF和Reality Studio迁移器。
- 提供确定性ZIP `.lafpkg`、篡改检测、分支、三方合并、Diff与传统格式导出。

## 快速使用

```bash
python -m laf_runtime validate examples/rncs-project-laf1.json
python -m laf_runtime migrate examples/legacy-laf-v0.7.json migrated.json
python -m laf_runtime pack examples/rncs-project-laf1.json demo.lafpkg
python -m laf_runtime verify-package demo.lafpkg
```

打开 `LAF_1.0_Workbench_离线版.html` 可离线审阅JSON工件。
