// Thin re-export wrappers to satisfy the module surface defined in the spec.
export * from "./webXXMPackageRegistry";
export {
  checkCompatibility,
  evaluatePackageSafety,
  runPackageQa,
} from "./webXXMPackageSafetyGuard";

import {
  downloadPackage as _download,
  installPackage as _install,
  enablePackage as _enable,
  disablePackage as _disable,
  uninstallPackage as _uninstall,
  updatePackage as _update,
  checkCapabilityCallable as _callable,
  listInstalled,
  getManifest,
} from "./webXXMPackageRegistry";

export const downloadWebXXMPackage  = _download;
export const installWebXXMPackage   = _install;
export const enableWebXXMPackage    = _enable;
export const disableWebXXMPackage   = _disable;
export const uninstallWebXXMPackage = _uninstall;
export const updateWebXXMPackage    = _update;

export function getWebXXMStoreSummary() {
  const all = Object.values({} as Record<string, unknown>);
  void all;
  const installed = listInstalled();
  return {
    intent: "Aether WebXXM Capability Store & Package Runtime",
    status: "ACTIVE",
    installedCount: installed.length,
    enabledCount: installed.filter((i) => i.enabled).length,
  };
}

export const checkCapabilityCallable = _callable;
export const getPackageManifest = getManifest;
