// CSL v0.9 Phase 2.3 demo · function-grading
// 应用类型:概念计算型 — 函数原语 + 派生字段
// 学生录入分数,前端用 评级(分数) 函数实时派生评级标签

export const FUNCTION_GRADING_CSL = `// ===== function-grading.csl =====
// 函数原语 + 实例 + 规则,演示概念计算型应用

概念 学生 {
  属性 名称: 文本
  属性 分数: 数值
}

不变量 分数有效 {
  条件 分数 >= 0
}

不变量 分数上限 {
  条件 分数 <= 100
}

实例 张三 属于 学生 {
  名称 = "张三"
  分数 = 85
}

实例 李四 属于 学生 {
  名称 = "李四"
  分数 = 55
}

实例 王五 属于 学生 {
  名称 = "王五"
  分数 = 95
}

函数 评级(分数) {
  如果 分数 >= 90 则 返回 "优秀"
  否则如果 分数 >= 60 则 返回 "合格"
  否则 返回 "不合格"
}

规则 标记不及格 {
  条件 候选 ∈ 学生 且 候选.分数 < 60
  动作 标记 "不及格"
}

规则 标记优秀 {
  条件 候选 ∈ 学生 且 候选.分数 >= 90
  动作 标记 "优秀"
}
`;

export const FUNCTION_GRADING_CSLAPP = `// ===== function-grading.cslapp =====

概念 应用 {
  属性 名称: 文本
  属性 版本: 文本
  属性 入口视图: 文本
  属性 目标环境: 文本
  属性 前端框架: 文本
  属性 后端框架: 文本
  属性 包含规格: 文本
}

概念 视图 {
  属性 编号: 文本
  属性 标题: 文本
  属性 路径: 文本
  属性 主概念: 文本
  属性 端点: 文本
  属性 方法: 文本
  属性 模式: 文本
}

实例 V_评分录入 属于 视图 {
  编号 = "V_评分录入"
  标题 = "学生评分录入"
  路径 = "/"
  主概念 = "学生"
  端点 = "/api/学生/评估"
  方法 = "POST"
  模式 = "form"
}

实例 FunctionGradingApp 属于 应用 {
  名称 = "Function Grading Demo"
  版本 = "0.1"
  入口视图 = "V_评分录入"
  目标环境 = "web"
  前端框架 = "react-ts"
  后端框架 = "node-ts"
  包含规格 = "function-grading.csl"
}
`;

export const FUNCTION_GRADING_FULL_SOURCE =
  FUNCTION_GRADING_CSL + '\n' + FUNCTION_GRADING_CSLAPP;
