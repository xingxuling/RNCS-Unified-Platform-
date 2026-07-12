// AetherSeed Dataset · 版本管理
// 数据集版本不可变；修订 = 新版本 + parentId 追溯。
import type { DatasetVersion } from "./datasetTypes";
import { buildDatasetVersion, getDatasetVersion, listDatasetVersions } from "./datasetBuilder";

export interface DatasetRevisionInput {
  parentId: string;
  name?: string;
  description?: string;
  /** 追加纳入的 sampleId / 排除的 sampleId */
  addSampleIds?: string[];
  removeSampleIds?: string[];
  addEvalSampleIds?: string[];
  removeEvalSampleIds?: string[];
}

export function reviseDataset(input: DatasetRevisionInput): DatasetVersion | undefined {
  const parent = getDatasetVersion(input.parentId);
  if (!parent) return undefined;
  const sampleIds = new Set(parent.sampleIds);
  for (const id of input.addSampleIds ?? []) sampleIds.add(id);
  for (const id of input.removeSampleIds ?? []) sampleIds.delete(id);
  const evalIds = new Set(parent.evalSampleIds);
  for (const id of input.addEvalSampleIds ?? []) evalIds.add(id);
  for (const id of input.removeEvalSampleIds ?? []) evalIds.delete(id);

  return buildDatasetVersion({
    name: input.name ?? parent.name,
    datasetType: parent.datasetType,
    sampleIds: Array.from(sampleIds),
    evalSampleIds: Array.from(evalIds),
    sourceIntakeRunIds: parent.sourceIntakeRunIds,
    description: input.description ?? `修订自 ${parent.id}（${parent.version}）`,
  });
}

export function findDatasetLineage(id: string): DatasetVersion[] {
  // v0.1 不持久化父子关系；按 name 聚类按时间排序作为近似血统线
  const target = getDatasetVersion(id);
  if (!target) return [];
  return listDatasetVersions()
    .filter((v) => v.name === target.name && v.datasetType === target.datasetType)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
