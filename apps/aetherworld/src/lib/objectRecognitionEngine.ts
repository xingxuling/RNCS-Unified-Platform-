import { BREAKTHROUGH_OBJECT_TYPES, getBreakthroughObjectType, type BreakthroughObjectType } from "@/constants/breakthroughObjectTypes";

export interface ObjectRecognitionResult {
  objectType: BreakthroughObjectType;
  confidence: number;
  hints: string[];
  restatement: string;
}

const KEYWORD_MAP: Array<{ id: string; keys: RegExp }> = [
  { id: "PRODUCT", keys: /产品|app|应用|功能|系统(?!.*文明)|界面/i },
  { id: "CONTENT", keys: /文案|内容|视频|帖子|小红书|公众号|文章/i },
  { id: "PLATFORM", keys: /平台|社区|算法|流量|推荐/i },
  { id: "MARKET", keys: /市场|赛道|行业|增长/i },
  { id: "CITY", keys: /城市|搬到|定居|留在/i },
  { id: "SCHOOL_APPLICATION", keys: /申请|留学|学校|offer|gpa|文书/i },
  { id: "CAREER_PATH", keys: /工作|职业|跳槽|创业|方向/i },
  { id: "HEALTH_STATE", keys: /身体|睡眠|疲劳|生病|健康/i },
  { id: "COGNITIVE_STATE", keys: /脑子|乱|焦虑|想太多|专注/i },
  { id: "RELATIONSHIP", keys: /关系|对方|男朋友|女朋友|父母|朋友|沟通/i },
  { id: "COMPANY", keys: /公司|团队|招聘|融资/i },
  { id: "PROJECT", keys: /项目|计划|deadline|交付/i },
  { id: "CREATIVE_WORK", keys: /作品|创作|写作|画/i },
  { id: "VIRTUAL_WORLD", keys: /虚拟世界|世界观|setting|宇宙(?!常数)/i },
  { id: "DEITY_OBJECT", keys: /神明|神|启示|占卜/i },
  { id: "ORGANIZATION", keys: /组织|社群|工会|协会/i },
  { id: "CIVILIZATION", keys: /文明|时代|历史进程/i },
  { id: "SYSTEM", keys: /系统|计算法|引擎|架构/i },
  { id: "PERSON", keys: /我自己|这个人|他|她/i },
];

export function recognizeObject(input: string, hintType?: string): ObjectRecognitionResult {
  const text = input.trim();
  if (hintType) {
    return {
      objectType: getBreakthroughObjectType(hintType),
      confidence: 0.95,
      hints: ["用户已显式指定对象类型"],
      restatement: text || "（未填写问题描述）",
    };
  }
  for (const m of KEYWORD_MAP) {
    if (m.keys.test(text)) {
      return {
        objectType: getBreakthroughObjectType(m.id),
        confidence: 0.7,
        hints: [`匹配关键词识别为 ${m.id}`],
        restatement: text,
      };
    }
  }
  return {
    objectType: getBreakthroughObjectType("UNKNOWN_OBJECT"),
    confidence: 0.3,
    hints: ["无法从文本识别对象类型，按未知对象处理"],
    restatement: text || "（未填写）",
  };
}

export const listBreakthroughObjectTypes = () => BREAKTHROUGH_OBJECT_TYPES;
