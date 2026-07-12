export interface TerminalExampleCommand {
  command: string;
  description: string;
  group: "基础" | "MSL" | "引擎" | "生成" | "知识" | "QA" | "Founder";
}

export const TERMINAL_EXAMPLE_COMMANDS: TerminalExampleCommand[] = [
  { command: "help",                                                 description: "查看命令帮助",       group: "基础" },
  { command: "status",                                               description: "当前终端状态",       group: "基础" },
  { command: "55555",                                                description: "纯数列自动 explain", group: "MSL" },
  { command: "parse 34230",                                          description: "解析数列",           group: "MSL" },
  { command: "explain 00000",                                        description: "解释数列",           group: "MSL" },
  { command: "block 49..60",                                         description: "查看 BLOCK",         group: "MSL" },
  { command: "run RESEED_CHAIN",                                     description: "运行 PROGRAM",       group: "MSL" },
  { command: "compile 55555 --to world",                             description: "编译到世界",         group: "MSL" },
  { command: "compile 55555 --to godot",                             description: "编译到 Godot",       group: "MSL" },
  { command: 'ask "我现在该不该推进这个项目？"',                       description: "自然语言提问",       group: "引擎" },
  { command: 'model.generate "生成一个 NPC 行为模型"',                description: "生成结构模型",       group: "生成" },
  { command: "world.generate --from 55555",                          description: "生成世界",           group: "生成" },
  { command: 'narrative.generate "给蓝天机写一段漫画脚本"',           description: "生成剧情",           group: "生成" },
  { command: 'vocal.prompt "把歌词生成 Suno prompt"',                 description: "生成音乐提示词",     group: "生成" },
  { command: 'translate "万物本身计算法" --to en',                    description: "翻译概念",           group: "引擎" },
  { command: 'knowledge.search "MSL"',                               description: "搜索知识库",         group: "知识" },
  { command: "qa.run",                                               description: "运行软件质量检查",   group: "QA" },
  { command: "recalc.all",                                           description: "运行总重算",         group: "QA" },
  { command: 'prompt.generate --target lovable "新增使用示例"',       description: "生成 Lovable 提示词", group: "引擎" },
  { command: "founder.status",                                       description: "创始人状态",         group: "Founder" },
];
