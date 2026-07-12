export const BREAKTHROUGH_QUESTIONS = [
  { id: "what",     question: "这个对象到底是什么？" },
  { id: "vars",     question: "它由哪些变量组成？" },
  { id: "stuck",    question: "它卡在哪里？" },
  { id: "missing",  question: "缺什么？" },
  { id: "resist",   question: "阻力是什么？" },
  { id: "action",   question: "现在应该进、守、转、断、等，还是补材料？" },
  { id: "path",     question: "如何生成解决路径？" },
  { id: "validate", question: "如何验证这条路径有效？" },
  { id: "fail",     question: "如果失败，失败本身说明什么？" },
  { id: "recurse",  question: "如何递归破解下一层问题？" },
] as const;

export type BreakthroughQuestionId = typeof BREAKTHROUGH_QUESTIONS[number]["id"];
