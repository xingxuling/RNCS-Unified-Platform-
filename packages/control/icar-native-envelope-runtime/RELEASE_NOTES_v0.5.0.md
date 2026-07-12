# ICAR Native Envelope Runtime v0.5.0 发布说明

## 定位

本版本将ICAR从“旧式应用结果生成器”升级为RNCS原生意图—能力应用运行时。意图、能力计划、候选差异、权限判断、RFE提交与观察者投影，从第一步开始共享同一Reality Transition Envelope。

## 主要新增

- Plan / Preview / Commit三阶段生命周期。
- Preview阶段不推进RFE Generation、不执行不可逆外部副作用。
- Living Artifact Format 1.0原生对象支持。
- RNCS Core Contract 0.1原生Envelope。
- RFE Core SDK 0.1原子Generation提交。
- HNAC 0.5宿主能力与状态引用。
- 开放能力注册表、候选比较与成本/风险评分。
- 权限、宿主能力与风险联合解析。
- Stale Preview保护和预览篡改检测。
- Commit后通知收据。
- 桌面与手机语义等价投影。
- ICAR Session明确降级为过程记录，不声明现实代际。

## 兼容性边界

v0.5以LAF 1.0、RNCS Contract 0.1和RFE Core SDK 0.1为正式主链。旧ICAR v0.4结果可由RNCS Core Contract适配器读取，但v0.5运行时不继续输出旧`icar.application-result.v0.1`格式。
