// 主体数据类型
export interface SubjectModel {
  id: string;
  isDemo: boolean;
  name: string;
  codeName?: string;
  age?: number;
  birthDate?: string; // YYYY-MM-DD
  birthTime?: string; // HH:mm
  birthPlace?: string;
  stage: string; // 当前阶段描述
  coreQuestion: string;
  focuses: string[]; // 事业/关系/...
  digits: number[][]; // 20 组五位数字（每组长度 5，0–9）
  createdAt: string;
}

export interface FeedbackRecord {
  subjectId: string;
  date: string; // YYYY-MM-DD
  hit: boolean;
  hitScore: number; // 0-100
  typeMatched: boolean;
  intensityMatched: boolean;
  actionWorked: boolean;
  noise: string[];
  notes?: string;
  createdAt: string;
}

export type FocusArea =
  | "事业"
  | "关系"
  | "身体"
  | "学业"
  | "财务"
  | "创作"
  | "身份"
  | "综合";

export const FOCUS_AREAS: FocusArea[] = [
  "事业", "关系", "身体", "学业", "财务", "创作", "身份", "综合",
];
