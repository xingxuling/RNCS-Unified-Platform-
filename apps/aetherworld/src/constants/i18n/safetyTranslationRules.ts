export interface SafetyTranslationRule {
  id: string;
  severity: "MEDIUM" | "HIGH" | "CRITICAL";
  forbiddenPatterns: RegExp[];
  description: string;
  recommendation: string;
}

export const SAFETY_TRANSLATION_RULES: SafetyTranslationRule[] = [
  {
    id: "absolute-guarantee",
    severity: "CRITICAL",
    forbiddenPatterns: [/一定会/, /保证成功/, /will definitely/i, /guaranteed to/i, /必ず実現/, /반드시 성공/, /garantit/i],
    description: "把“可能”翻译成“一定”。",
    recommendation: "改用：可能 / likely / かもしれない / 가능 / possible。",
  },
  {
    id: "fate-determinism",
    severity: "CRITICAL",
    forbiddenPatterns: [/命运决定/, /destiny is fixed/i, /fate is sealed/i],
    description: "把“结构读取”翻译成“命运决定”。",
    recommendation: "保留 ‘可能性 / 趋势 / structure reading’。",
  },
  {
    id: "virtual-as-real",
    severity: "HIGH",
    forbiddenPatterns: [/现实替代/, /replace your real life/i, /現実の代わり/, /현실 대체/],
    description: "把虚拟生活翻译为现实替代。",
    recommendation: "强调 ‘虚拟模拟 / virtual simulation’。",
  },
  {
    id: "prediction-as-result",
    severity: "HIGH",
    forbiddenPatterns: [/保证结果/, /guarantee the outcome/i, /結果を保証/, /결과를 보장/],
    description: "把预测翻译为保证结果。",
    recommendation: "使用 ‘预测 / forecast / suggest’。",
  },
  {
    id: "past-life-proof",
    severity: "HIGH",
    forbiddenPatterns: [/真实前世/, /proof of past life/i, /前世の証明/],
    description: "把前世感材料翻译为真实前世证明。",
    recommendation: "保留 ‘潜意识 / archetypal material’。",
  },
  {
    id: "missing-disclaimer",
    severity: "HIGH",
    forbiddenPatterns: [],
    description: "翻译可能遗漏医疗/法律/金融/心理诊断免责声明。",
    recommendation: "翻译涉及健康/法律/金融时必须保留免责说明。",
  },
  {
    id: "msl-changes-reality",
    severity: "CRITICAL",
    forbiddenPatterns: [/MSL.*改变现实/, /MSL.*changes reality/i, /MSL.*現実を変え/],
    description: "把 MSL 描述为可直接改变现实。",
    recommendation: "MSL = state-driven language；改用 ‘state modeling / world logic compile’。",
  },
  {
    id: "replace-engine",
    severity: "HIGH",
    forbiddenPatterns: [/替代\s*(Unity|Godot)/i, /replace\s+(Unity|Godot)/i],
    description: "把产品描述为替代 Unity/Godot。",
    recommendation: "改为 ‘compiles to Unity/Godot’。",
  },
];
