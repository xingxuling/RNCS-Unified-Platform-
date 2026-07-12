// CSL 自举规格 #6：suffix-system.csl
// 用 v0.8 子集表达 CSL 跨平台母源格式的四层后缀体系
// 来源：《CSL 跨平台母源格式与四层后缀体系草案 v1》
// 加载方式：tokenize → parse → buildIR → SpecRegistry.suffixes / platforms / buildSteps

export const SUFFIX_SYSTEM_CSL = `// ===== CSL 自举规格 · suffix-system =====
// 元目标：把"四层后缀体系"作为 CSL 自身的元数据,而不是只作为外部文档
// 当前阶段：仅声明骨架,未来 v1.0 由 .cslpkg 工具链消费

// ---------- 元类型 1：后缀（Suffix） ----------

概念 后缀 {
  属性 编号: 文本           // .csl / .cslapp / .cslschema / .cslpkg
  属性 中文名: 文本
  属性 层级: 文本           // 源码层 / 应用本体层 / 元规格层 / 平台映射层
  属性 阶段: 文本           // Phase 1/2/3/4
  属性 状态: 文本           // active / drafting / planned
  属性 父后缀: 文本         // 上一层后缀（空表示根）
  属性 描述: 文本
}

// ---------- 元类型 2：平台目标（PlatformTarget） ----------

概念 平台目标 {
  属性 编号: 文本           // windows / android / apple / web
  属性 中文名: 文本
  属性 原生格式: 文本       // MSIX / AAB+APK / app bundle / web build
  属性 状态: 文本           // planned / disabled
  属性 描述: 文本
}

// ---------- 元类型 3：构建步骤（BuildStep） ----------

概念 构建步骤 {
  属性 编号: 文本           // cslc / csl_build / csl_schema / csl_pack / csl_run
  属性 命令: 文本
  属性 输入后缀: 文本       // 引用 后缀.编号
  属性 输出后缀: 文本
  属性 状态: 文本           // planned / disabled
  属性 描述: 文本
}

// ---------- 后缀实例：四层 ----------

实例 SFX_CSL 属于 后缀 {
  编号 = ".csl"
  中文名 = "结构语言源文件"
  层级 = "源码层"
  阶段 = "Phase 1"
  状态 = "active"
  父后缀 = ""
  描述 = "概念/实例/属性/规则/不变量/证据/主体/阶段/编译层/再生事件/信号"
}

实例 SFX_CSLAPP 属于 后缀 {
  编号 = ".cslapp"
  中文名 = "应用本体文件"
  层级 = "应用本体层"
  阶段 = "Phase 3"
  状态 = "drafting"
  父后缀 = ".csl"
  描述 = "组织多个 .csl 文件,声明 AppID/版本/模块/视图/能力/目标平台/入口（已在 projection 模块中以 v0.8 子集落地最小版）"
}

实例 SFX_CSLSCHEMA 属于 后缀 {
  编号 = ".cslschema"
  中文名 = "元规格文件"
  层级 = "元规格层"
  阶段 = "Phase 2"
  状态 = "drafting"
  父后缀 = ".csl"
  描述 = "用 CSL 写 CSL 自身：grammar registry / AST / IR / feature map / 示例注册 / 后缀体系"
}

实例 SFX_CSLPKG 属于 后缀 {
  编号 = ".cslpkg"
  中文名 = "打包与平台映射文件"
  层级 = "平台映射层"
  阶段 = "Phase 4"
  状态 = "planned"
  父后缀 = ".cslapp"
  描述 = "package id / target platform / output format / signing / manifest mapping / build pipeline"
}

// ---------- 平台目标实例 ----------

实例 P_WIN 属于 平台目标 {
  编号 = "windows"
  中文名 = "Windows"
  原生格式 = "MSIX"
  状态 = "planned"
  描述 = "桌面端,通过 .cslpkg 投影到 MSIX 安装协议"
}

实例 P_ANDROID 属于 平台目标 {
  编号 = "android"
  中文名 = "Android"
  原生格式 = "AAB / APK"
  状态 = "planned"
  描述 = "移动端,经 Gradle / bundletool 产出 AAB 或 APK"
}

实例 P_APPLE 属于 平台目标 {
  编号 = "apple"
  中文名 = "Apple"
  原生格式 = "app bundle"
  状态 = "planned"
  描述 = "iOS / macOS,经 Xcode 工具链产出 .app / .ipa"
}

实例 P_WEB 属于 平台目标 {
  编号 = "web"
  中文名 = "Web"
  原生格式 = "web build"
  状态 = "planned"
  描述 = "浏览器端,经 Vite / 静态托管发布"
}

// ---------- 构建步骤实例（未来工具链 cslc 草案） ----------

实例 STEP_CSLC 属于 构建步骤 {
  编号 = "cslc"
  命令 = "cslc"
  输入后缀 = ".csl"
  输出后缀 = "ir.json"
  状态 = "planned"
  描述 = "核心编译器：源码 → AST → IR"
}

实例 STEP_BUILD 属于 构建步骤 {
  编号 = "csl_build"
  命令 = "csl build"
  输入后缀 = ".cslapp"
  输出后缀 = "build/"
  状态 = "planned"
  描述 = "构建应用本体：聚合多个 .csl,生成可运行产物"
}

实例 STEP_SCHEMA 属于 构建步骤 {
  编号 = "csl_schema"
  命令 = "csl schema compile"
  输入后缀 = ".cslschema"
  输出后缀 = "registry.json"
  状态 = "drafting"
  描述 = "编译语言自身规格,产出 SpecRegistry（当前已在 loader.ts 中实现 web 内嵌版）"
}

实例 STEP_PACK 属于 构建步骤 {
  编号 = "csl_pack"
  命令 = "csl pack"
  输入后缀 = ".cslpkg"
  输出后缀 = "MSIX / APK / AAB / app / web"
  状态 = "planned"
  描述 = "按平台映射打包到目标原生格式"
}

实例 STEP_RUN 属于 构建步骤 {
  编号 = "csl_run"
  命令 = "csl run"
  输入后缀 = ".cslapp"
  输出后缀 = "runtime"
  状态 = "planned"
  描述 = "本地 runtime 运行,无需打包"
}

// ---------- 不变量：后缀体系自一致 ----------

不变量 后缀编号必填 {
  条件 编号 ≠ ""
}

不变量 后缀层级必填 {
  条件 层级 ≠ ""
}

不变量 平台原生格式必填 {
  条件 原生格式 ≠ ""
}

// ---------- 规则：当前可激活的后缀 ----------

规则 检查_当前可用后缀 {
  条件 候选 ∈ 后缀
  且 候选.状态 = "active"
  动作 标记 "可在当前 Playground 直接使用"
}

规则 检查_自举进行中 {
  条件 候选 ∈ 后缀
  且 候选.状态 = "drafting"
  动作 标记 "正在自举,本轮草案产出"
}

// ---------- 证据：来源与定性 ----------

证据 草案出处 {
  来源 = "CSL 跨平台母源格式与四层后缀体系草案 v1"
  原文 = "CSL 不应被当作平台原生安装格式的替代品,而应被定义为跨平台应用、规则系统、数字主体与结构文明工具链的母源格式"
  支持 = SFX_CSL, SFX_CSLAPP, SFX_CSLSCHEMA, SFX_CSLPKG
}

证据 推进顺序 {
  来源 = "草案 §七 最合理的现实路线"
  原文 = "Phase1 .csl → Phase2 .cslschema → Phase3 .cslapp → Phase4 .cslpkg"
  支持 = SFX_CSL, SFX_CSLSCHEMA, SFX_CSLAPP, SFX_CSLPKG
}

证据 边界声明 {
  来源 = "草案 §三 / §九"
  原文 = "不是让 .csl 直接变成 APK/MSIX,而是让 .csl 成为 APK/MSIX 之上的母语"
  支持 = P_WIN, P_ANDROID, P_APPLE, P_WEB
}
`;
