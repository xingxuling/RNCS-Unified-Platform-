// AetherSeed Dataset · Workspace 草案
import type { DatasetExportArtifact, DatasetVersion } from "./datasetTypes";
import { buildDatasetManifest } from "./datasetManifestBuilder";

export interface DatasetWorkspaceArtifact {
  id: string;
  kind: "AETHERSEED_DATASET_VERSION";
  title: string;
  createdAt: string;
  payload: {
    version: DatasetVersion;
    manifest: ReturnType<typeof buildDatasetManifest>;
    exports: DatasetExportArtifact[];
  };
}

export function buildDatasetWorkspaceArtifact(
  version: DatasetVersion,
  exports: DatasetExportArtifact[],
): DatasetWorkspaceArtifact {
  return {
    id: `AS-DS-WS-${Date.now().toString(36)}`,
    kind: "AETHERSEED_DATASET_VERSION",
    title: `数据集 · ${version.name} · ${version.version}`,
    createdAt: new Date().toISOString(),
    payload: {
      version,
      manifest: buildDatasetManifest(version),
      exports,
    },
  };
}
