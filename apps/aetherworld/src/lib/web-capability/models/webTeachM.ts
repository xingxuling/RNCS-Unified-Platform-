import { makeCapabilityModel } from "./_makeCapabilityModel";
export const webTeachM = makeCapabilityModel({
  capabilityId: "WEB_TEACH_M",
  name: "WebTeachM",
  chineseName: "教学能力模型",
  domain: "TEACHING",
  description: "教学计划、知识拆解、学习路径、练习题、反馈、学习文档。分层解释，给例子，不假装用户已掌握。",
  inputTypes: ["TOPIC", "LEARNING_GOAL", "USER_LEVEL", "KNOWLEDGE_ITEM"],
  outputTypes: ["LESSON_OBJECT", "COURSE_OUTLINE_OBJECT", "EXERCISE_OBJECT", "LEARNING_PATH_OBJECT", "FEEDBACK_OBJECT"],
  requiredKnowledgeSources: ["LEARNING_DOCS_KNOWLEDGE", "LOCAL_KNOWLEDGE_BASE"],
  requiredCalculusIds: ["TEACHING_PATH_CALCULUS"],
  requiredConstants: ["LAYERED_EXPLANATION", "DO_NOT_ASSUME_PRIOR_MASTERY"],
  toolInterfaces: ["LEARNING_DOCS", "WEBLLM"],
  workspaceObjectTypes: ["WEB_CAPABILITY_RUN_OBJECT", "LESSON_OBJECT"],
});
