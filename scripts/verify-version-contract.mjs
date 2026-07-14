import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
}

const errors = [];
const rootPackage = await readJson("package.json");
const lockfile = await readJson("package-lock.json");
const registry = await readJson("rncs.modules.json");
const manifest = await readJson("VERSION-MANIFEST-v0.19.8.json");

if (rootPackage.version !== "0.19.8-alpha.1") {
  errors.push(`root package version is ${rootPackage.version}, expected 0.19.8-alpha.1`);
}
if (lockfile.version !== rootPackage.version || lockfile.packages?.[""]?.version !== rootPackage.version) {
  errors.push("package-lock root version does not match package.json");
}
if (registry.suiteVersion !== rootPackage.version) {
  errors.push("rncs.modules.json suiteVersion does not match package.json");
}
if (manifest.version !== rootPackage.version) {
  errors.push("release manifest version does not match package.json");
}

let checkedModules = 0;
for (const module of registry.modules ?? []) {
  if (!module.path || (!module.path.startsWith("packages/") && !module.path.startsWith("apps/"))) {
    continue;
  }
  try {
    const packageJson = await readJson(path.join(module.path, "package.json"));
    checkedModules += 1;
    if (packageJson.version !== module.version) {
      errors.push(`${module.id}: registry ${module.version} != package.json ${packageJson.version}`);
    }
  } catch (error) {
    errors.push(`${module.id}: cannot read ${module.path}/package.json (${error.code ?? error.message})`);
  }
}

const report = {
  ok: errors.length === 0,
  suiteVersion: rootPackage.version,
  checkedModules,
  errors
};
console.log(JSON.stringify(report, null, 2));
if (errors.length > 0) process.exitCode = 1;
