// 概念难度评分 · Concept Difficulty Scores (0-100)
export const CONCEPT_DIFFICULTY_SCORES: Record<string, number> = {
  "定数计算法": 80,
  "分支塌缩":   88,
  "信号净化":   65,
  "风域奇点":   95,
  "五域":       70,
  "天地人神风": 70,
  "回验":       45,
  "真实主体":   55,
  "Full 60":    75,
  "Full 60完整主体": 75,
  "多计算法内核": 85,
  "事件算法":   68,
  "提示词计算法": 72,
  "行动许可":   58,
  "预测维度":   62,
  "主体数列":   60,
  "三循环":     78,
  "主线合法性": 82,
  "终端模式":   80,
  "地区用户计算法": 70,
  "软件测试反馈计算法": 65,
  "总重新计算算法": 60,
  "多用户端 UI 适评算法": 65,
  "Demo Persona": 35,
  "Light 20":   40,
  "Imported":   30,
  "Prompt Forge": 50,
};

export function getConceptDifficulty(term: string): number {
  return CONCEPT_DIFFICULTY_SCORES[term] ?? 50;
}
