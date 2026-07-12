export interface PlotStructureDef {
  id: string;
  name: string;
  description: string;
  beats: string[];
  forbiddenMistakes: string[];
}

export const PLOT_STRUCTURES: PlotStructureDef[] = [
  { id: "THREE_ACT",                                name: "三幕式",                       description: "建立 / 对抗 / 解决", beats: ["建立日常","触发事件","冲突升级","中点反转","低谷","最终对峙","余波"], forbiddenMistakes: ["二幕拖沓"] },
  { id: "HERO_JOURNEY",                             name: "英雄旅程",                     description: "12 步英雄之旅简化", beats: ["平凡世界","召唤","拒绝","导师","跨越","试炼","深渊","重生","回归"], forbiddenMistakes: ["跳过深渊"] },
  { id: "WEBNOVEL_GOLDEN_THREE_CHAPTERS",           name: "网文黄金三章",                 description: "前三章定生死",       beats: ["异常开场+人物立住+世界露一角","冲突推进+主角特殊性显影","选择/代价/主线钩子明确"], forbiddenMistakes: ["第一章堆设定","主角不行动","冲突迟迟不出现","读者不知道看点"] },
  { id: "MYSTERY_REVEAL",                           name: "谜团揭示",                     description: "层层揭谜",           beats: ["呈现谜面","错误假设","新线索","误导","真相揭示","代价"], forbiddenMistakes: ["最终真相突然出现无伏笔"] },
  { id: "CHARACTER_DRIVEN",                         name: "人物驱动",                     description: "角色弧线推动事件",   beats: ["欲望","裂痕","选择","代价","转化"], forbiddenMistakes: ["人物不变"] },
  { id: "WORLD_REVEAL",                             name: "世界观逐层展开",               description: "靠世界规则推动",     beats: ["局部世界","规则冲突","隐藏层级","秩序根源","系统真貌"], forbiddenMistakes: ["规则前后矛盾"] },
  { id: "QUEST_CHAIN",                              name: "任务链",                       description: "游戏式任务推进",     beats: ["接任务","调查","遭遇","主目标","回报","新钩子"], forbiddenMistakes: ["任务无关主线"] },
  { id: "SLICE_OF_LIFE_WITH_HIDDEN_MAINLINE",       name: "日常表层 + 暗线主线",         description: "表面日常底层主线",   beats: ["日常","微异常","真实裂缝","暗线显化","局部抉择","余波回归日常"], forbiddenMistakes: ["全程纯日常无主线"] },
];

export function getPlotStructure(id: string) {
  return PLOT_STRUCTURES.find(p => p.id === id);
}
