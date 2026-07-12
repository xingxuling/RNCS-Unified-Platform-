import { createFileRoute } from "@tanstack/react-router";
import { ExternalDataSourceRegistryTable } from "@/components/reality-data/ExternalDataSourceRegistryTable";
import { DataIngestionPanel } from "@/components/reality-data/DataIngestionPanel";
import { RealityDataSafetyNote } from "@/components/reality-data/RealityDataSafetyNote";

export const Route = createFileRoute("/external-data-sources")({
  head: () => ({
    meta: [
      { title: "外部数据源 · External Data Sources" },
      { name: "description", content: "管理外部数据源注册表：类型、可信度、隐私、访问方式。" },
    ],
  }),
  component: () => (
    <div className="container mx-auto px-4 py-6 max-w-6xl space-y-5">
      <header>
        <h1 className="text-2xl font-semibold">外部数据源</h1>
        <p className="text-sm text-muted-foreground">注册和管理用于现实校准的外部数据源。</p>
      </header>
      <ExternalDataSourceRegistryTable />
      <DataIngestionPanel />
      <RealityDataSafetyNote />
    </div>
  ),
});
