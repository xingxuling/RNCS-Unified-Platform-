import type { AppArchitectureObject, AppRequirementObject } from "./appProjectObjectEngine";
import type { AppFrameworkTarget } from "@/constants/app-runtime/appFrameworkTargets";
import type { AppRuntimeMode } from "@/constants/app-runtime/appRuntimeModes";

export function generateAppArchitecture(
  projectId: string,
  req: AppRequirementObject,
  runtimeMode: AppRuntimeMode,
): AppArchitectureObject {
  const frameworkTarget: AppFrameworkTarget =
    runtimeMode === "STATIC_PREVIEW" ? "SINGLE_HTML"
    : runtimeMode === "VITE_DRAFT" ? "VITE_REACT"
    : "REACT_COMPONENT";

  const stateFields = req.mvpFeatures.map(f => `${f.featureId}State`);

  return {
    architectureId: `arch-${projectId}`,
    projectId,
    frameworkTarget,
    pageMap: [{
      pageId: "page-home",
      route: "/",
      title: req.productSummary.split(":")[0] || "主页",
      purpose: "应用主入口，承载 MVP 全部功能。",
      components: req.mvpFeatures.map(f => `${f.featureId}Section`),
    }],
    componentMap: req.mvpFeatures.map(f => ({
      componentId: `cmp-${f.featureId}`,
      name: `${f.featureId}Section`,
      responsibility: f.description,
      props: ["onAction"],
      stateUsed: [`${f.featureId}State`],
    })),
    stateModel: {
      stateFields,
      localStorageFields: stateFields.map(s => `aether.app.${s}`),
      derivedStates: [],
    },
    dataModel: {
      entities: req.mvpFeatures.map(f => ({
        name: `${f.featureId}Item`,
        fields: ["id:string", "createdAt:string", "value:string"],
      })),
    },
    eventFlow: req.mvpFeatures.map(f => ({
      from: "User",
      to: `${f.featureId}Section`,
      event: `${f.featureId}Triggered`,
    })),
    risks: [
      "v0.1 不包含真实后端，复杂业务需 Handoff",
      "未做无障碍审计",
    ],
  };
}
