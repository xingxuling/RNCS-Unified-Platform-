import { MSLStatement } from "./mslParser";
import { interpretStatement } from "./mslInterpreter";
import { getOpcode } from "@/constants/msl/mslOpcodes";
import { safetyNotesFor } from "./mslSafetyGuard";

export type MSLCompileTarget =
  | "WORLD_ENGINE"
  | "EVENT_ENGINE"
  | "NPC_PROFILE"
  | "QUEST_PROFILE"
  | "RENDER_PROFILE"
  | "SEMANTIC_PHYSICS"
  | "ANIMATION_PROFILE"
  | "IAL"
  | "PROMPT_FORGE"
  | "UNITY_JSON"
  | "GODOT_JSON"
  | "MARKDOWN_REPORT";

export interface MSLCompileResult {
  target: MSLCompileTarget;
  output: unknown;
  trace: string[];
  safetyNotes: string[];
}

function digitToActionVerbs(digit: string): string[] {
  return getOpcode(digit).bias;
}

export function compileStatement(stmt: MSLStatement, target: MSLCompileTarget, opts?: { isFull60?: boolean }): MSLCompileResult {
  const trace: string[] = [`解析 ${stmt.raw}`];
  const interp = interpretStatement(stmt);
  trace.push(`语义：${interp.summary}`);

  let output: unknown;
  switch (target) {
    case "RENDER_PROFILE": {
      const ds = stmt.digits;
      const shiftCount = ds.filter(d => d === "5").length;
      const voidCount = ds.filter(d => d === "0").length;
      output = {
        kind: "RenderProfile",
        sequence: stmt.raw,
        particleDensity: 0.3 + shiftCount * 0.15,
        rotation: shiftCount >= 2 ? "spiral-fast" : "stable",
        lightIntensity: 0.4 + (ds.filter(d => d === "1").length) * 0.2,
        palette: shiftCount >= 3 ? ["#ff5d3a", "#ffd166", "#3a86ff"] : ["#1f2937", "#374151", "#9ca3af"],
        windFactor: shiftCount * 0.2,
        voidFactor: voidCount * 0.25,
      };
      trace.push("→ Render Profile：根据 SHIFT/VOID 计数生成粒子/旋转/光照参数。");
      break;
    }
    case "SEMANTIC_PHYSICS": {
      const ds = stmt.digits;
      output = {
        kind: "SemanticPhysics",
        sequence: stmt.raw,
        eventMomentum: ds.filter(d => d === "5").length * 0.25,
        stability: 0.2 + ds.filter(d => d === "6").length * 0.25,
        gravityType: ds.includes("9") ? "convergent" : "balanced",
        resistance: ds.filter(d => d === "4").length * 0.2,
      };
      trace.push("→ Semantic Physics：依据 5/6/4/9 计算事件动量、稳定性、重力与阻力。");
      break;
    }
    case "ANIMATION_PROFILE": {
      const ds = stmt.digits;
      output = {
        kind: "AnimationProfile",
        sequence: stmt.raw,
        tempo: ds.filter(d => d === "5").length >= 2 ? "fast-cut" : "easeInOut",
        transitions: ds.includes("0") ? "fade-archive" : "wind-burst",
        intensity: ds.filter(d => d === "5").length * 0.2 + 0.2,
      };
      trace.push("→ Animation Profile：根据 SHIFT 决定剪辑节奏与转场。");
      break;
    }
    case "NPC_PROFILE": {
      output = {
        kind: "NpcProfile",
        sequence: stmt.raw,
        archetype: stmt.digits[2] === "2" ? "Connector" : stmt.digits[2] === "7" ? "Hidden Watcher" : "Generic",
        relationBias: interp.actionBias,
      };
      trace.push("→ NPC Profile：以人域位（C 位）为主决定原型。");
      break;
    }
    case "QUEST_PROFILE": {
      output = {
        kind: "QuestProfile",
        sequence: stmt.raw,
        triggerStrength: stmt.digits[4] === "5" ? "HIGH" : stmt.digits[4] === "0" ? "DORMANT" : "MEDIUM",
        objective: interp.terminalMeaning,
      };
      trace.push("→ Quest Profile：以风域位（E 位）决定触发强度。");
      break;
    }
    case "WORLD_ENGINE": {
      output = {
        kind: "WorldEngineProfile",
        sequence: stmt.raw,
        sequenceCore: {
          dominant: interp.dominantOpcodes,
          missing: interp.missingOpcodes,
        },
        worldState: { phase: interp.terminalMeaning, biases: interp.worldBias },
        renderHint: interp.actionBias.slice(0, 4),
      };
      trace.push("→ World Engine：构造 SequenceCore + WorldState + RenderHint。");
      break;
    }
    case "EVENT_ENGINE": {
      output = {
        kind: "EventEngineInput",
        sequence: stmt.raw,
        triggers: interp.actionBias,
        risk: interp.riskFlags,
      };
      trace.push("→ Event Engine：以 actionBias 作为触发器候选。");
      break;
    }
    case "IAL": {
      const op = (i: number) => getOpcode(stmt.digits[i]).name;
      output = {
        kind: "STRUCTURE_STATE",
        heaven: op(0),
        earth: op(1),
        human: op(2),
        spirit: op(3),
        wind: op(4),
        constraints: [
          stmt.digits[4] === "0" ? "terminal_void" : "terminal_active",
          "language_rule_relation_rebuild",
        ],
        allowed_actions: interp.actionBias,
        forbidden_actions: stmt.digits[4] === "0" ? ["force_manifestation"] : [],
      };
      trace.push("→ IAL：将五位映射到 STRUCTURE_STATE，并基于终端位生成约束。");
      break;
    }
    case "PROMPT_FORGE": {
      output =
        `# MSL → Prompt\n` +
        `Sequence: ${stmt.raw}\n` +
        `Heaven: ${interp.domainMeanings.heaven}\n` +
        `Earth:  ${interp.domainMeanings.earth}\n` +
        `Human:  ${interp.domainMeanings.human}\n` +
        `Spirit: ${interp.domainMeanings.spirit}\n` +
        `Wind:   ${interp.domainMeanings.wind}\n\n` +
        `Action bias: ${interp.actionBias.join("，")}\n` +
        `World bias:  ${interp.worldBias.join("，") || "无"}\n` +
        `Risk flags:  ${interp.riskFlags.join("，") || "无"}\n`;
      trace.push("→ Prompt Forge：生成 Markdown 形态提示词。");
      break;
    }
    case "UNITY_JSON": {
      const verbs = stmt.digits.flatMap(digitToActionVerbs);
      output = {
        schema: "msl-unity-v1",
        sequence: stmt.raw,
        domains: { Heaven: stmt.digits[0], Earth: stmt.digits[1], Human: stmt.digits[2], Spirit: stmt.digits[3], Wind: stmt.digits[4] },
        opcodes: stmt.opcodes,
        suggestedBehaviors: verbs,
      };
      trace.push("→ Unity JSON：PascalCase 字段，便于 Unity C# 反序列化。");
      break;
    }
    case "GODOT_JSON": {
      output = {
        schema: "msl_godot_v1",
        sequence: stmt.raw,
        domains: { heaven: stmt.digits[0], earth: stmt.digits[1], human: stmt.digits[2], spirit: stmt.digits[3], wind: stmt.digits[4] },
        opcodes: {
          heaven: stmt.opcodes.heaven,
          earth: stmt.opcodes.earth,
          human: stmt.opcodes.human,
          spirit: stmt.opcodes.spirit,
          wind: stmt.opcodes.wind,
        },
        suggested_behaviors: stmt.digits.flatMap(digitToActionVerbs),
      };
      trace.push("→ Godot JSON：snake_case 字段，便于 GDScript 解析。");
      break;
    }
    case "MARKDOWN_REPORT":
    default: {
      output =
        `## MSL ${stmt.raw}\n\n` +
        `- 摘要：${interp.summary}\n` +
        `- 终端：${interp.terminalMeaning}\n` +
        `- 主导操作码：${interp.dominantOpcodes.join("，") || "无"}\n` +
        `- 行动倾向：${interp.actionBias.join("，")}\n` +
        `- 世界倾向：${interp.worldBias.join("，") || "无"}\n` +
        `- 风险标记：${interp.riskFlags.join("，") || "无"}\n`;
      trace.push("→ Markdown Report：生成人类可读报告。");
    }
  }

  return {
    target,
    output,
    trace,
    safetyNotes: safetyNotesFor({ isFull60: opts?.isFull60, hasTrace: trace.length > 0 }),
  };
}
