// P8 — 跨壳层动作文案统一表
// 同一动作在所有壳层(showcase/workspace/viewer/compare)必须使用同一文案与同一语义。
// 不允许某处叫"打开"实际是"复制",或某处叫"另存"实际是"转入"。
//
// 命名约定:
//   convertToWorkspace = 把演示对象/viewer 对象转入正式工作区(根据 lockState 决定可编辑/只读)
//   forkAsEditable     = 只读 → 新建一份可编辑副本(物理复制,产生新工作区)
//   backToShowcase     = 把当前对象带回演示壳查看(保留 source/version/lockState/origin)
//   openInCompareSrc   = 以此对象作为 Compare 的 source 打开 compare 壳
//   openInCompareTgt   = 以此对象作为 Compare 的 target 打开 compare 壳
//   openInViewer       = 以只读 Viewer 壳打开此对象 (查看,不可编辑、不可运行修改、可看详情/可定位源码)
//   openInPlayground   = 跳转到 Playground 继续编辑 (要求对象在工作区中)
//   exportSource       = 导出 .csl 源码
//   exportBundle       = 导出 .cslbundle.zip 当前版本运行包
//   exportSnapshot     = 导出诊断快照 JSON
//   exportCompareJSON  = 导出 Compare 对照报告 JSON
//   reRun              = 重新运行
//   removeFromUserPool = 从用户对象池中移除(不影响内置模板)

export const ACTIONS = {
  convertToWorkspace:  '转入正式工作区',
  forkAsEditable:      '另存为可编辑工作区',
  backToShowcase:      '回到演示壳查看',
  openInCompareSrc:    '以此对象进入 Compare(作为 source)',
  openInCompareTgt:    '以此对象进入 Compare(作为 target)',
  openInViewer:        '打开 Viewer(只读查看)',
  openInPlayground:    '前往 Playground 继续编辑',
  exportSource:        '导出 .csl 源码',
  exportBundle:        '导出当前版本运行包',
  exportSnapshot:      '导出诊断快照(JSON)',
  exportCompareJSON:   '导出对照报告(JSON)',
  reRun:               '重新运行',
  removeFromUserPool:  '从用户对象池中移除',
} as const;

export type ActionKey = keyof typeof ACTIONS;
