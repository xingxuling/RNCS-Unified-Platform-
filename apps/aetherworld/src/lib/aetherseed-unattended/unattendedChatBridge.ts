// AetherSeed Unattended Training Factory · Chat 桥
import { listRuns } from "./unattendedStore";
import { summarizeRun } from "./unattendedRuntime";

export interface UnattendedChatCard {
  title: string;
  body: string;
  hint: string;
}

const FAQ: Array<{ test: RegExp; reply: string }> = [
  {
    test: /(息屏|关屏|关闭屏幕).*(训练|可以)/,
    reply:
      "可以关闭屏幕。屏幕关闭只省电，不会影响训练。但「系统睡眠」必须关闭，否则训练进程会被挂起。建议：powercfg /change standby-timeout-ac 0。",
  },
  {
    test: /(浏览器|关闭浏览器|关掉浏览器).*(训练|会停)/,
    reply:
      "关闭浏览器不会停止训练，因为训练由本地守护器（local-gateway）以独立进程运行。浏览器只是观察窗口，重新打开后可恢复查看状态。",
  },
  {
    test: /(LoRA|QLoRA|SFT).*(自己|血统|AetherSeed)/,
    reply:
      "算。只要使用 Aetherworld 数据集、实验账本、模型接入并持续迭代，LoRA / QLoRA / SFT 训练出的模型都属于 AetherSeed 血统模型。无需从零预训练。",
  },
  {
    test: /(下一炉|下一轮).*建议/,
    reply: "可在无人值守训练工厂点击「生成下一炉」，系统会基于当前 eval 与 loss 自动生成下一炉训练计划。",
  },
  {
    test: /(checkpoint|检查点)/,
    reply: "最新 checkpoint 会写入 ./AetherSeed/<runId>/checkpoints/，并自动登记到实验账本。",
  },
];

export function answerUnattendedQuestion(q: string): { reply: string; cards: UnattendedChatCard[] } {
  const cards = listRuns()
    .slice(0, 3)
    .map<UnattendedChatCard>((r) => ({
      title: `${r.targetModelName} · ${r.status}`,
      body: summarizeRun(r),
      hint: `runId=${r.id}`,
    }));

  for (const item of FAQ) {
    if (item.test.test(q)) return { reply: item.reply, cards };
  }
  return {
    reply:
      "无人值守训练工厂支持创建 / 开始 / 暂停 / 恢复 / 取消训练任务，自动写实验账本，自动生成下一炉建议。请进入 /system/unattended-training 查看。",
    cards,
  };
}
