// src/agi-shell/agiShellCore.ts
import {
  SEEDRuntime,
  WorldState,
} from "../seed-runtime/seedRuntime";
import { createWorldFromPreset, UniversePreset } from "../seed-runtime/universeForge";
import {
  applyIALToRuntime,
} from "../ial/ialRuntimeBridge";
import {
  classifyIntent,
  ShellIntent,
} from "./intentPolicies";

export type ShellRole = "user" | "agent" | "world" | "system";

export interface ShellMessage {
  role: ShellRole;
  text: string;
  meta?: Record<string, any>;
}

export interface ShellTurnResult {
  messages: ShellMessage[];
  worldState: WorldState;
}

/**
 * AGI Shell 核心：
 * - 把自然语言 / IAL 输入，路由到对应的结构操作
 * - 所有世界修改都通过 SEEDRuntime 完成
 */
export class AGIShellCore {
  private runtime: SEEDRuntime;
  private universePreset: UniversePreset;

  constructor(runtime: SEEDRuntime, universePreset: UniversePreset) {
    this.runtime = runtime;
    this.universePreset = universePreset;
  }

  /** 读取当前世界状态（从 runtime 拉，不自己缓存） */
  private getWorld(): WorldState {
    return this.runtime.getWorldState();
  }

  /** 重置宇宙（按当前 preset） */
  private resetUniverse(): WorldState {
    const world = createWorldFromPreset(this.universePreset);
    this.runtime.loadWorldState(world);
    return world;
  }

  /**
   * 处理一条用户输入：
   * - 支持自然语言
   * - 支持 IAL 命令（前缀：IAL 或 >）
   */
  public async processUserInput(input: string): Promise<ShellTurnResult> {
    const trimmed = input.trim();
    let world = this.getWorld();

    const messages: ShellMessage[] = [
      { role: "user", text: trimmed },
    ];

    // 1. IAL 语句：以 "IAL " 开头 或 以 ">" 开头
    if (trimmed.startsWith("IAL ") || trimmed.startsWith(">")) {
      const expr = trimmed.startsWith("IAL ")
        ? trimmed.slice(4).trim()
        : trimmed.slice(1).trim();

      const mainEntityId = world.entities[0]?.id ?? "e-main";

      const res = applyIALToRuntime(this.runtime, expr, {
        mainEntityId,
        intensity: 0.08,
      });

      world = res.worldState;

      messages.push({
        role: "agent",
        text: `已执行以太文明指令：\n\n${expr}`,
        meta: {
          ialContext: res.execution.context,
          events: res.events,
        },
      });

      const ent = world.entities[0];
      messages.push({
        role: "world",
        text: [
          `主线实体【${ent?.identityProfile?.name ?? "N/A"}】状态：`,
          `- 命运收束度：${(ent?.fateVector?.convergenceScore ?? 0).toFixed(3)}`,
          `- 结构稳定度：${(ent?.state?.structuralStability ?? 0).toFixed(3)}`,
          `- 结构压力：${world.globalParameters.structuralPressure.toFixed(3)}`,
        ].join("\n"),
      });

      return { messages, worldState: world };
    }

    // 2. 自然语言 → 意图识别
    const intent: ShellIntent = classifyIntent(trimmed);

    switch (intent.type) {
      case "STATUS": {
        const ent = world.entities[0];
        messages.push({
          role: "agent",
          text:
            "这是当前宇宙与主线命运的状态概览（结构视角）：",
        });
        messages.push({
          role: "world",
          text: [
            `宇宙 ID：${world.universeId}`,
            `时间索引：${world.timeIndex}`,
            `全局以太密度：${world.globalParameters.aetherDensity.toFixed(3)}`,
            `全局结构压力：${world.globalParameters.structuralPressure.toFixed(3)}`,
            `全局熵：${world.globalParameters.entropyLevel.toFixed(3)}`,
            "",
            `主线实体：${ent?.identityProfile?.name ?? "N/A"}`,
            `- 命运收束度：${(ent?.fateVector?.convergenceScore ?? 0).toFixed(3)}`,
            `- 命运发散度：${(ent?.fateVector?.divergenceScore ?? 0).toFixed(3)}`,
            `- 结构稳定度：${(ent?.state?.structuralStability ?? 0).toFixed(3)}`,
          ].join("\n"),
        });
        break;
      }

      case "ADVANCE": {
        const steps = intent.steps ?? 1;
        for (let i = 0; i < steps; i++) {
          const r = this.runtime.executeCycle();
          world = r.worldState;
        }
        const ent = world.entities[0];
        messages.push({
          role: "agent",
          text: `已推进命运时间线 ${steps} 步。`,
        });
        messages.push({
          role: "world",
          text: [
            `当前时间索引：${world.timeIndex}`,
            `主线当前节点：${world.activeTimelines[0]?.currentNodeId ?? "N/A"}`,
            `主线命运收束度：${(
              world.activeTimelines[0]?.convergenceScore ?? 0
            ).toFixed(3)}`,
            `主线实体收束度：${(
              ent?.fateVector?.convergenceScore ?? 0
            ).toFixed(3)}`,
          ].join("\n"),
        });
        break;
      }

      case "RESET": {
        world = this.resetUniverse();
        messages.push({
          role: "agent",
          text: "已重置宇宙为初始状态（主线起源节点重新装载）。",
        });
        break;
      }

      case "HELP": {
        messages.push({
          role: "agent",
          text: [
            "这里是 The Seed · AGI Shell。你可以这样和我交互：",
            "",
            "1）查询状态：",
            "   - \"看一下现在的宇宙情况\"",
            "   - \"当前命运收束度是多少？\"",
            "",
            "2）推进命运时间线：",
            "   - \"前进一步\" / \"推进 5 步\"",
            "",
            "3）重置宇宙：",
            "   - \"重置宇宙\" / \"从头再来\"",
            "",
            "4）直接施放 IAL 指令：",
            "   - `IAL Ψ Σ : Γ K Z : V Z₊`",
            "   - 或者：`> Ψ Σ : Γ K Z : V Z₊`",
            "",
            "自然语言部分目前是简化版路由器，但底层是真实的文明运行时。",
          ].join("\n"),
        });
        break;
      }

      case "UNKNOWN":
      default: {
        messages.push({
          role: "agent",
          text:
            "我接收到了你的指令，但目前的本地 Shell 只实现了部分意图路由。\n你可以尝试：\n- 查询状态（例如：现在的世界状态）\n- 推进时间线（例如：前进 3 步）\n- 重置宇宙\n- 或者直接使用 IAL 指令（前缀 IAL 或 >）。",
        });
        break;
      }
    }

    return { messages, worldState: world };
  }
}

