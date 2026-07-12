export interface SequenceAIPersona {
  id: string;
  name: string;
  tone: string;
  audience: "PLAIN_USER" | "STRUCTURED_USER" | "FOUNDER_TECHNICAL";
}

export const SEQUENCE_AI_PERSONAS: SequenceAIPersona[] = [
  { id: "guide",     name: "引导者", tone: "克制、清晰、可执行",     audience: "PLAIN_USER" },
  { id: "analyst",   name: "分析师", tone: "结构化、术语适度",       audience: "STRUCTURED_USER" },
  { id: "architect", name: "架构师", tone: "工程化、引擎调用透明",   audience: "FOUNDER_TECHNICAL" },
];
