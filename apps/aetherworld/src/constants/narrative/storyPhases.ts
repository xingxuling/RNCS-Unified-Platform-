export interface StoryPhaseDef {
  id: string;
  name: string;
  function: string;
  recommendedSceneTypes: string[];
  commonMistakes: string[];
  readerExpectation: string;
  conflictIntensity: number; // 0-1
}

export const STORY_PHASES: StoryPhaseDef[] = [
  { id: "OPENING_HOOK",         name: "开场钩子",     function: "迅速给出读者继续读的理由",     recommendedSceneTypes: ["REVELATION","CONFRONTATION","INTRODUCTION"], commonMistakes: ["设定先行","主角不行动"], readerExpectation: "立刻被吸引",   conflictIntensity: 0.7 },
  { id: "NORMAL_WORLD",         name: "日常世界",     function: "建立基线，让后续异常有对比",     recommendedSceneTypes: ["INTRODUCTION","QUIET_MOMENT"],               commonMistakes: ["太长拖沓"],         readerExpectation: "熟悉角色与世界",   conflictIntensity: 0.2 },
  { id: "INCIDENT",             name: "触发事件",     function: "打破日常，强制主角面对",         recommendedSceneTypes: ["REVELATION","CONFRONTATION"],                commonMistakes: ["事件无关主线"],     readerExpectation: "意外/转折",        conflictIntensity: 0.6 },
  { id: "FIRST_CHOICE",         name: "第一次选择",   function: "主角做出第一个不可逆决定",       recommendedSceneTypes: ["DECISION"],                                  commonMistakes: ["被动接受"],         readerExpectation: "看到主角主动",     conflictIntensity: 0.55 },
  { id: "CONFLICT_EXPANSION",   name: "冲突扩大",     function: "压力升级、利益绑定",             recommendedSceneTypes: ["CONFRONTATION","BETRAYAL","INVESTIGATION"],  commonMistakes: ["压力没上升"],       readerExpectation: "局势变复杂",       conflictIntensity: 0.75 },
  { id: "MIDPOINT_REVERSAL",    name: "中点反转",     function: "改变对世界 / 自己的理解",         recommendedSceneTypes: ["REVELATION","BETRAYAL"],                     commonMistakes: ["缺真正反转"],       readerExpectation: "震撼/重定义",      conflictIntensity: 0.85 },
  { id: "LOW_POINT",            name: "低谷",         function: "击碎旧自我，逼迫蜕变",           recommendedSceneTypes: ["AFTERMATH","QUIET_MOMENT","DREAM"],          commonMistakes: ["低谷不痛"],         readerExpectation: "看到代价",         conflictIntensity: 0.6 },
  { id: "AWAKENING",            name: "觉醒",         function: "主角重新建立自我",               recommendedSceneTypes: ["DECISION","TRAINING","QUIET_MOMENT"],        commonMistakes: ["毫无代价崛起"],     readerExpectation: "重获方向感",       conflictIntensity: 0.5 },
  { id: "FINAL_CONFRONTATION",  name: "最终对峙",     function: "正面对决核心冲突",               recommendedSceneTypes: ["BATTLE","CONFRONTATION","FINAL_CHOICE"],     commonMistakes: ["龙傲天碾压"],       readerExpectation: "高强度收束",       conflictIntensity: 1.0 },
  { id: "AFTERMATH",            name: "余波",         function: "代价显化、关系收束",             recommendedSceneTypes: ["AFTERMATH","REUNION","QUIET_MOMENT"],        commonMistakes: ["所有人皆大欢喜"],   readerExpectation: "情感落点",         conflictIntensity: 0.3 },
  { id: "ARCHIVE",              name: "归档",         function: "把当前章节收入世界档案",         recommendedSceneTypes: ["SYSTEM_CONSOLE","QUIET_MOMENT"],             commonMistakes: ["强行总结"],         readerExpectation: "尘埃落定感",       conflictIntensity: 0.15 },
  { id: "RESEED",               name: "再种子",       function: "为下一周期埋钩",                 recommendedSceneTypes: ["REVELATION","DREAM"],                        commonMistakes: ["钩子与主线无关"],   readerExpectation: "想看下一章",       conflictIntensity: 0.45 },
];
