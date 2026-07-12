import type { AppType } from "@/constants/app-runtime/appTypes";

export interface AppRuntimeExample {
  id: string;
  title: string;
  rawIdea: string;
  appType: AppType;
  mvp: string[];
}

export const APP_RUNTIME_EXAMPLES: AppRuntimeExample[] = [
  { id: "ex-1",  title: "番茄钟网页",            rawIdea: "做一个番茄钟网页，专注 25 分钟、休息 5 分钟。",  appType: "TOOL_APP",            mvp: ["计时器", "开始 / 暂停 / 重置", "完成提示"] },
  { id: "ex-2",  title: "个人作品集 Landing",     rawIdea: "做一个个人作品集 landing page，展示项目与联系方式。", appType: "PORTFOLIO_APP",  mvp: ["Hero", "项目卡片", "联系方式"] },
  { id: "ex-3",  title: "歌词 Prompt 生成器",     rawIdea: "做一个 Suno 歌词 Prompt 生成器。",                appType: "MUSIC_TOOL_APP",      mvp: ["主题输入", "结构选择", "复制结果"] },
  { id: "ex-4",  title: "世界观设定管理器",       rawIdea: "做一个世界观设定管理器。",                        appType: "WORLD_BUILDER_APP",   mvp: ["条目列表", "详情编辑", "标签分类"] },
  { id: "ex-5",  title: "简单任务看板",           rawIdea: "做一个简单的任务看板，能添加任务并标记完成。",    appType: "WORKFLOW_APP",        mvp: ["任务列表", "添加任务", "完成标记"] },
  { id: "ex-6",  title: "术语查询页",             rawIdea: "做一个 Aetherworld 术语查询页。",                appType: "KNOWLEDGE_BASE_APP",  mvp: ["搜索框", "结果列表", "详情面板"] },
  { id: "ex-7",  title: "产品 Demo Landing",      rawIdea: "做一个产品 Demo 的 Landing Page。",              appType: "LANDING_PAGE_APP",    mvp: ["Hero", "特性区", "CTA"] },
  { id: "ex-8",  title: "角色卡生成器",           rawIdea: "做一个角色卡生成器，输入名字与设定输出卡片。",    appType: "CREATIVE_GENERATOR_APP",mvp: ["输入表单", "卡片预览", "导出图片占位"] },
  { id: "ex-9",  title: "小型计算器工具",         rawIdea: "做一个简单的 BMI 计算器。",                       appType: "TOOL_APP",            mvp: ["输入身高体重", "计算结果", "解释说明"] },
  { id: "ex-10", title: "AI 聊天机器人外壳",      rawIdea: "做一个 AI 聊天机器人外壳页面，不接真实模型。",   appType: "CHATBOT_APP",         mvp: ["对话窗口", "输入框", "本地历史"] },
];
