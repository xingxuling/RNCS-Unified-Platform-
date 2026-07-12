# API

## `normalizeIntent(input)`
规范化并密封资产意图。

## `deriveGenomeFromIntent(intent)`
参考编译器：从中文/英文描述和显式约束生成资产基因组。

## `ProviderRegistry`
注册带内容根的能力提供者。

## `negotiateCapabilities(requirements, registry, options)`
按质量、成本和延迟选择 Provider。

## `generateAssetWorkspace(input, {outDir, providers})`
执行完整创生闭环并写入资产、工作区和证据。

## `verifyWorkspace(workspace)`
验证根、推荐候选、身份连续性和因果引用。

## `createContinuityBundle(...)`
输出资产持续管线导入对象。

## `createStudioImport(...)`
创建 Reality Studio 导入提案。
