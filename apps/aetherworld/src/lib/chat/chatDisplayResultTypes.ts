export type ChatDisplayResultType =
  | "TEXT"
  | "OBJECT"
  | "APP"
  | "CODE"
  | "PATCH"
  | "WORLD"
  | "MUSIC"
  | "CONCEPT"
  | "KNOWLEDGE"
  | "QA"
  | "STORE"
  | "SYSTEM";

export type ChatDisplayResultQa = "PASS" | "WARN" | "FAIL" | "BLOCKED" | "NOT_CHECKED";

export interface ChatResultAction {
  actionId: string;
  label: string;
  /**
   * OPEN_DETAIL  打开详情页面
   * SAVE         保存到工作区
   * CONTINUE     继续 / 追问
   * RUN          继续运行某项操作
   * COPY         复制内容
   * EXPORT       导出
   * INSTALL      安装（商店）
   * ENABLE       启用（商店）
   * DOWNLOAD     下载（商店）
   * CUSTOM       自定义
   */
  actionType:
    | "OPEN_DETAIL"
    | "SAVE"
    | "CONTINUE"
    | "RUN"
    | "COPY"
    | "EXPORT"
    | "INSTALL"
    | "ENABLE"
    | "DOWNLOAD"
    | "CUSTOM";
  targetRoute?: string;
  targetObjectId?: string;
  targetRunId?: string;
  payload?: Record<string, unknown>;
  style?: "primary" | "secondary" | "danger";
}

/**
 * 对话承接层的统一结果结构。
 * 所有模块的输出，都应该先包装成 ChatDisplayResult，再在对话中显示。
 */
export interface ChatDisplayResult {
  resultId: string;
  resultType: ChatDisplayResultType;

  /** 卡片标题，例如 “应用草案已生成” */
  title: string;
  /** 一句话摘要，移动端也只显示这一句 */
  summary: string;
  /** 详细正文（Markdown / 纯文本），桌面端展开显示 */
  mainContent?: string;
  /** 结构化预览（每张卡片自己解释） */
  structuredPreview?: Record<string, unknown>;

  /** 关联工作区对象 */
  objectId?: string;
  objectType?: string;
  /** 关联运行记录 */
  runId?: string;

  qaStatus: ChatDisplayResultQa;

  /** 输出来源模块，例如 "WebCodeM"、"AppRuntime"、"WebLWM" */
  sourceModule: string;

  actions: ChatResultAction[];

  createdAt: string;
}
