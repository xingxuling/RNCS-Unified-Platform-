import { TERMINAL_COMMANDS } from "@/constants/terminal/terminalCommands";

export function buildHelp(topic?: string, isFounder = false): string {
  if (!topic) {
    const lines = ["数列终端 · 命令总览\n"];
    const groups: Record<string, string[]> = {
      基础: [],
      MSL: [],
      引擎: [],
      "QA / Recalc": [],
      知识: [],
      导出: [],
      Founder: [],
    };
    for (const c of TERMINAL_COMMANDS) {
      let group = "基础";
      if (["parse", "explain", "block", "run", "compile"].includes(c.command)) group = "MSL";
      else if (c.command.startsWith("founder") || c.command.startsWith("engine.") || c.command.startsWith("system.") || c.command === "route.trace" || c.command === "knowledge.lock" || c.command === "encyclopedia.write") group = "Founder";
      else if (c.command === "qa.run" || c.command.startsWith("recalc")) group = "QA / Recalc";
      else if (c.command.startsWith("knowledge.") || c.command.startsWith("encyclopedia.")) group = "知识";
      else if (c.command === "export") group = "导出";
      else if (["ask", "model.generate", "world.generate", "world.export", "narrative.generate", "vocal.prompt", "translate", "prompt.generate"].includes(c.command)) group = "引擎";

      if (group === "Founder" && !isFounder) continue;
      groups[group].push(`  ${c.command.padEnd(28)} ${c.description}`);
    }
    for (const [name, items] of Object.entries(groups)) {
      if (items.length === 0) continue;
      lines.push(`【${name}】`);
      lines.push(...items);
      lines.push("");
    }
    if (!isFounder) {
      lines.push("Founder 命令需要创始人模式。输入 `help founder` 查看说明。");
    }
    return lines.join("\n");
  }

  const t = topic.toLowerCase();
  if (t === "msl") {
    return [
      "MSL 命令：",
      "  parse <seq>                 解析数列",
      "  explain <seq>               解释数列",
      "  block <a..b>                BLOCK 段落",
      "  run <PROGRAM>               运行 PROGRAM，如 run RESEED_CHAIN",
      "  compile <seq> --to <target> 编译到 world / ial / render / godot / unity / json / prompt",
      "",
      "提示：直接输入纯五位数列（例如 55555）会自动 explain。",
    ].join("\n");
  }
  if (t === "export") {
    return [
      "导出命令：",
      "  export last --format markdown",
      "  export last --format json",
      "  export history --format markdown",
      "  export world --target godot",
      "  export world --target unity",
      "  export model --target typescript",
      "  export knowledge --format json",
      "",
      "私有 / Full60 导出会要求二次确认。",
    ].join("\n");
  }
  if (t === "founder") {
    if (!isFounder) {
      return "Founder 命令需要创始人模式。请前往 Founder Gate 解锁后再查看。";
    }
    return [
      "Founder 命令：",
      "  founder.status",
      "  engine.list",
      "  engine.audit",
      "  system.audit",
      "  knowledge.lock <entryId>",
      "  encyclopedia.write <entryId>",
      "  route.trace \"<query>\"",
      "  terminal.permissions",
    ].join("\n");
  }
  return `未识别的 help 主题：${topic}。可用主题：msl / export / founder。`;
}
