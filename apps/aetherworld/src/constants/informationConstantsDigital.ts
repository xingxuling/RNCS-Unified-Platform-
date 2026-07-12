import type { RealityScienceConstant } from "./physicsConstantsDigital";

function c(id: string, name: string, cn: string, meaning: string, positive: string, risk: string, example: string, actions: string[]): RealityScienceConstant {
  return { id, name, userFriendlyName: cn, meaning, positiveUse: positive, risk, example, relatedActions: actions };
}

export const INFORMATION_CONSTANTS_DIGITAL: RealityScienceConstant[] = [
  c("SIGNAL_QUALITY","Signal Quality","信号质量","输入可靠度。","清洗输入。","脏数据。","用户随手记。",["数据校验"]),
  c("NOISE_LEVEL","Noise Level","噪声水平","伪信号水平。","降噪。","信号被淹。","情绪化反馈。",["降噪"]),
  c("COMPRESSION_RATE","Compression Rate","压缩率","复杂能否压缩。","抽象成模板。","碎片化。","数百片段无归纳。",["归纳"]),
  c("ENCODING_CLARITY","Encoding Clarity","编码清晰度","数据/文案是否可读。","结构化。","混乱。","字段命名随意。",["统一规范"]),
  c("INDEXABILITY","Indexability","可索引性","能否快速检索。","建索引。","埋深。","只能滚动浏览。",["搜索+标签"]),
  c("FEEDBACK_RESOLUTION","Feedback Resolution","反馈分辨率","回验细度。","细粒度反馈。","粗反馈。","只评 1–5 星。",["维度反馈"]),
  c("DATA_LOCALITY","Data Locality","数据本地性","数据本地可控。","保留本地副本。","云依赖。","全云无备份。",["本地存"]),
  c("MEMORY_PERSISTENCE","Memory Persistence","记忆持久度","状态长期保存。","长期持久化。","会话即丢。","刷新就清空。",["持久化"]),
  c("INTEROPERABILITY","Interoperability","互操作性","与其他模块互通。","通用接口。","孤岛。","数据进不出。",["导出"]),
  c("ERROR_CORRECTION","Error Correction","错误修正","从错误恢复。","容错设计。","错即崩。","一个空指针崩首页。",["错误边界"]),
];
