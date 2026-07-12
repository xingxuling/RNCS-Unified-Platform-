export const WEB_KNOWLEDGE_RETRIEVAL_MODES = [
  { id: "KEYWORD_RETRIEVAL", title: "关键词检索", supported: true },
  { id: "TAG_RETRIEVAL", title: "标签检索", supported: true },
  { id: "OBJECT_LINK_RETRIEVAL", title: "对象关联检索", supported: true },
  { id: "VERSION_AWARE_RETRIEVAL", title: "版本感知检索", supported: true },
  { id: "CONCEPT_AWARE_RETRIEVAL", title: "概念感知检索 (预留)", supported: false },
  { id: "HYBRID_RETRIEVAL", title: "混合检索", supported: true },
] as const;
export type WebKnowledgeRetrievalMode = typeof WEB_KNOWLEDGE_RETRIEVAL_MODES[number]["id"];
export const DEFAULT_WEB_KNOWLEDGE_RETRIEVAL_MODE: WebKnowledgeRetrievalMode = "HYBRID_RETRIEVAL";
