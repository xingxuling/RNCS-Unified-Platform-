// 训练工厂 · Skeleton / Muscle / Blood / Nerve 四象补法
import type { QuadrantSlice } from "./trainingFactoryTypes";

export function buildQuadrants(): QuadrantSlice[] {
  return [
    {
      quadrant: "SKELETON",
      label: "骨架（结构）",
      items: [
        { id: "SK-1", name: "TrainingSample", note: "训练样本统一结构。" },
        { id: "SK-2", name: "DatasetVersion", note: "可版本化的数据集快照。" },
        { id: "SK-3", name: "TrainingRecipe", note: "配方：基座 + 方法 + 超参。" },
        { id: "SK-4", name: "ModelBloodline", note: "AetherSeed 血统线 10M → 7B。" },
        { id: "SK-5", name: "EvalSet", note: "评测题库与指标。" },
        { id: "SK-6", name: "ModelRegistry", note: "模型登记表。" },
        { id: "SK-7", name: "TrainingStatus enum", note: "DRAFT/READY/RUNNING/COMPLETED/FAILED/EVALUATED。" },
      ],
    },
    {
      quadrant: "MUSCLE",
      label: "肌肉（执行算子）",
      items: [
        { id: "MU-1", name: "DatasetBuilder", note: "从分类语料组装数据集。" },
        { id: "MU-2", name: "RecipeBuilder", note: "选择训练方法与超参草案。" },
        { id: "MU-3", name: "CostEstimator", note: "估算时间 / 注意力 / 风险成本。" },
        { id: "MU-4", name: "TrainScriptGenerator", note: "为 Codex / Cursor 生成训练脚本草案。" },
        { id: "MU-5", name: "EvalRunner Plan", note: "生成评测执行计划（不真正执行）。" },
        { id: "MU-6", name: "ProviderImporter", note: "Ollama / WebLLM 接入步骤生成。" },
        { id: "MU-7", name: "RunbookBuilder", note: "手动执行 Runbook 草案。" },
      ],
    },
    {
      quadrant: "BLOOD",
      label: "血液（数据循环）",
      items: [
        { id: "BL-1", name: "Corpus Flow", note: "原始语料汇聚到训练工厂。" },
        { id: "BL-2", name: "Sample Flow", note: "语料 → 样本流转。" },
        { id: "BL-3", name: "Dataset Flow", note: "样本 → 数据集版本。" },
        { id: "BL-4", name: "Checkpoint Flow", note: "训练快照流转（占位，由用户手动管理）。" },
        { id: "BL-5", name: "Eval Flow", note: "评测数据流转。" },
        { id: "BL-6", name: "Feedback Flow", note: "回验 → 数据重加权。" },
        { id: "BL-7", name: "Record Flow", note: "事件写入 Record Center。" },
        { id: "BL-8", name: "Currency Flow", note: "训练 / 评测贡献写入数列货币（账本内部计量）。" },
      ],
    },
    {
      quadrant: "NERVE",
      label: "神经（编排与反馈）",
      items: [
        { id: "NE-1", name: "Scheduler", note: "训练工厂任务草案进入调度。" },
        { id: "NE-2", name: "MSL", note: "训练状态机以 MSL 表达。" },
        { id: "NE-3", name: "Record Center", note: "训练 / 评测事件持久化。" },
        { id: "NE-4", name: "Analytics", note: "训练健康度与趋势统计。" },
        { id: "NE-5", name: "Verification Center", note: "评测与回验闭环。" },
        { id: "NE-6", name: "Bug Audit", note: "训练相关问题登记。" },
        { id: "NE-7", name: "Notice", note: "训练状态变化通知。" },
        { id: "NE-8", name: "Failure Recovery", note: "失败重训计划（草案）。" },
        { id: "NE-9", name: "NextGenerationTrigger", note: "触发下一代 AetherSeed 训练计划。" },
      ],
    },
  ];
}
