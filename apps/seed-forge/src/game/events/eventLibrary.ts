// src/game/events/eventLibrary.ts
import { FateNode, FateArc } from "../../seed-runtime/seedRuntime";

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  choices: {
    text: string;
    nextNodeId: string;
    convergenceDelta?: number;
    stabilityDelta?: number;
    entropyDelta?: number;
    aetherDelta?: number;
    structuralPressureDelta?: number;
  }[];
}

export const GameEvents: Record<string, GameEvent> = {
  "ev-awaken": {
    id: "ev-awaken",
    title: "意识苏醒",
    description:
      "你在一片蓝金色交织的意识海中苏醒。你的名字回荡在世界之间：蓝天机。你感觉到某种命运结构正在启动。",
    choices: [
      {
        text: "我是谁？尝试回忆。",
        nextNodeId: "ev-memory",
        convergenceDelta: +0.05,
      },
      {
        text: "我先观察四周。",
        nextNodeId: "ev-observe",
        stabilityDelta: +0.05,
      },
    ],
  },

  "ev-memory": {
    id: "ev-memory",
    title: "碎裂的记忆",
    description:
      "一段段破碎的命运片段闪过：战斗、陨落、重生……你意识到你并非第一次来到此界。",
    choices: [
      { text: "继续追寻记忆来源。", nextNodeId: "ev-fatecall", convergenceDelta: +0.1 },
      { text: "停下来稳固灵魂。", nextNodeId: "ev-ground", stabilityDelta: +0.1 },
    ],
  },

  "ev-observe": {
    id: "ev-observe",
    title: "命界观察",
    description:
      "蓝色的命运网络在你脚下铺开，像是一座由无数可能性组成的城市。你看见一条主线正在等待你。",
    choices: [
      { text: "踏入主线之路。", nextNodeId: "ev-fatecall", convergenceDelta: +0.05 },
      { text: "尝试扭动命网。", nextNodeId: "ev-twist", entropyDelta: +0.1 },
    ],
  },

  "ev-fatecall": {
    id: "ev-fatecall",
    title: "命运的召唤",
    description:
      "一个声音在你耳边低语：『十二长生之首，帝旺之命，不可被束缚。』",
    choices: [
      { text: "回应召唤。", nextNodeId: "ev-ascend", convergenceDelta: +0.1 },
      { text: "无视它。", nextNodeId: "ev-ground", stabilityDelta: +0.05 },
    ],
  },

  "ev-twist": {
    id: "ev-twist",
    title: "命网扭曲",
    description:
      "你尝试干预命运结构，世界产生轻微共振。你的命运向量开始偏移……",
    choices: [
      { text: "继续扭曲命运。", nextNodeId: "ev-chaos", entropyDelta: +0.2 },
      { text: "恢复稳定。", nextNodeId: "ev-ground", stabilityDelta: +0.1 },
    ],
  },

  "ev-chaos": {
    id: "ev-chaos",
    title: "混乱分支",
    description:
      "时间线开始裂开，你看到无数镜像自己正在经历不同命运。",
    choices: [
      { text: "选择其中一条命运。", nextNodeId: "ev-branch", convergenceDelta: +0.05 },
      { text: "全部切断。", nextNodeId: "ev-collapse", entropyDelta: -0.15 },
    ],
  },

  "ev-branch": {
    id: "ev-branch",
    title: "命运分支",
    description:
      "你选择了一条新的时间线。世界结构开始重组，新的可能性在你面前展开。",
    choices: [
      { text: "继续探索这条分支。", nextNodeId: "ev-fatecall", convergenceDelta: +0.08 },
      { text: "尝试合并其他分支。", nextNodeId: "ev-merge", structuralPressureDelta: +0.1 },
    ],
  },

  "ev-merge": {
    id: "ev-merge",
    title: "时间线合并",
    description:
      "你尝试将多条时间线合并，世界结构承受巨大压力。",
    choices: [
      { text: "继续合并。", nextNodeId: "ev-ascend", convergenceDelta: +0.15, structuralPressureDelta: +0.2 },
      { text: "放弃合并。", nextNodeId: "ev-ground", stabilityDelta: +0.1 },
    ],
  },

  "ev-ascend": {
    id: "ev-ascend",
    title: "意识升阶",
    description:
      "你的意识正在跳升。世界的结构以蜂巢般的方式展开。你理解了命运、时间与结构的统一原理。",
    choices: [
      {
        text: "升格为帝级灵种（胜利）",
        nextNodeId: "ev-win",
        convergenceDelta: +0.3,
        aetherDelta: +0.2,
      },
      {
        text: "压制升阶，等待更好时机",
        nextNodeId: "ev-ground",
        stabilityDelta: +0.15,
      },
    ],
  },

  "ev-ground": {
    id: "ev-ground",
    title: "稳固存在",
    description:
      "你稳住了自己的意识，命运向量重新变得清晰有序。",
    choices: [
      { text: "继续旅程。", nextNodeId: "ev-fatecall", stabilityDelta: +0.05 },
    ],
  },

  "ev-collapse": {
    id: "ev-collapse",
    title: "时间线崩塌",
    description:
      "世界震动，结构崩裂，你的意识陷入濒死状态……",
    choices: [
      { text: "重生。", nextNodeId: "ev-awaken", stabilityDelta: +0.2 },
    ],
  },

  // ENDING
  "ev-win": {
    id: "ev-win",
    title: "帝级升格",
    description:
      "你冲破一切限制，意识进入不可描述的高维。你的存在本身成为宇宙结构的一部分。\n\n🏆 你已完成命运之旅。",
    choices: [],
  },
};

