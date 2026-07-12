import type { CrossFunctionalIntentType } from "@/constants/cross-functional/crossFunctionalIntentTypes";
import type { CrossFunctionalObjectType } from "@/constants/cross-functional/crossFunctionalVariableTypes";
import type { CrossFunctionalWorkflowType } from "@/constants/cross-functional/crossFunctionalWorkflowTypes";

export interface CrossFunctionalExample {
  id: string;
  title: string;
  description: string;
  inputText: string;
  inputObjectType: CrossFunctionalObjectType;
  intentType: CrossFunctionalIntentType;
  workflowType: CrossFunctionalWorkflowType;
  expectedOutputs: string[];
}

export const CROSS_FUNCTIONAL_EXAMPLES: CrossFunctionalExample[] = [
  { id: "ex01", title: "角色 → 角色歌", description: "把角色蓝天机变成一首角色歌", inputText: "角色：蓝天机，把他变成角色歌", inputObjectType: "CHARACTER", intentType: "CHARACTER_TO_SONG", workflowType: "CHARACTER_ASSET_PACK", expectedOutputs: ["剧情片段","角色歌歌词","Suno Prompt"] },
  { id: "ex02", title: "角色 → 剧情片段", description: "为角色生成一段剧情", inputText: "把角色蓝天机写成一段剧情", inputObjectType: "CHARACTER", intentType: "CHARACTER_TO_NARRATIVE", workflowType: "CHARACTER_ASSET_PACK", expectedOutputs: ["剧情片段"] },
  { id: "ex03", title: "世界观 → 世界主题曲", description: "为世界生成主题曲", inputText: "用 Aetherworld 世界观生成一首世界主题曲", inputObjectType: "WORLD", intentType: "WORLD_TO_SONG", workflowType: "WORLD_ASSET_PACK", expectedOutputs: ["世界百科","主题曲","视觉 Prompt"] },
  { id: "ex04", title: "世界观 → 游戏任务", description: "把世界变成游戏任务", inputText: "用世界生成一组游戏任务", inputObjectType: "WORLD", intentType: "WORLD_TO_GAME_QUEST", workflowType: "WORLD_ASSET_PACK", expectedOutputs: ["任务剧情"] },
  { id: "ex05", title: "剧情片段 → Suno Prompt", description: "把剧情打包成 Suno Prompt", inputText: "把这段剧情转成 Suno prompt", inputObjectType: "STORY", intentType: "STORY_TO_PROMPT", workflowType: "SONG_PRODUCTION_PACK", expectedOutputs: ["Suno Prompt"] },
  { id: "ex06", title: "歌词 → 日文 / 英文演唱版", description: "把歌词翻成多语言演唱版", inputText: "把这段歌词翻译成日文和英文演唱版", inputObjectType: "LYRIC", intentType: "SONG_TO_TRANSLATION", workflowType: "SONG_PRODUCTION_PACK", expectedOutputs: ["多语言版","保留语气与押韵"] },
  { id: "ex07", title: "产品概念 → 产品文档", description: "把产品概念变成文档", inputText: "把这个产品概念生成产品文档", inputObjectType: "PRODUCT", intentType: "PRODUCT_TO_DOCS", workflowType: "PRODUCT_BUILD_PACK", expectedOutputs: ["产品文档"] },
  { id: "ex08", title: "产品概念 → 代码生成需求", description: "把产品概念变成代码任务", inputText: "把这个产品概念生成代码", inputObjectType: "PRODUCT", intentType: "MODEL_TO_CODE", workflowType: "PRODUCT_BUILD_PACK", expectedOutputs: ["代码任务","文档","QA"] },
  { id: "ex09", title: "数列 → 世界风格", description: "用数列生成世界风格", inputText: "用数列 55555 生成世界风格", inputObjectType: "SEQUENCE", intentType: "SEQUENCE_TO_WORLD", workflowType: "SEQUENCE_CREATION_PACK", expectedOutputs: ["世界风格建议"] },
  { id: "ex10", title: "数列 → 声乐风格", description: "用数列生成声乐风格", inputText: "用数列 34230 生成声乐风格", inputObjectType: "SEQUENCE", intentType: "SEQUENCE_TO_VOCAL", workflowType: "SEQUENCE_CREATION_PACK", expectedOutputs: ["声乐风格","曲风倾向"] },
  { id: "ex11", title: "词汇百科 → 新手教程", description: "把词条变成新手教程", inputText: "把 Full60 这个词汇生成新手教程", inputObjectType: "VOCABULARY_TERM", intentType: "VOCABULARY_TO_DOCS", workflowType: "PRODUCT_BUILD_PACK", expectedOutputs: ["新手教程"] },
  { id: "ex12", title: "计算法条目 → 使用示例", description: "为计算法生成使用示例", inputText: "为「万物本身计算法」生成使用示例", inputObjectType: "CALCULUS", intentType: "ENGINE_TO_USAGE_EXAMPLES", workflowType: "PRODUCT_BUILD_PACK", expectedOutputs: ["使用示例"] },
];

export function listCrossFunctionalExamples() {
  return CROSS_FUNCTIONAL_EXAMPLES;
}
