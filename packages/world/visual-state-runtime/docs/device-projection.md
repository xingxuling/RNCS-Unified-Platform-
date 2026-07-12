# Device Projection Fabric

## 目标

同一个观察者视图在不同宿主中可以改变几何、DPR、安全区和输入能力，但不能改变其来源现实。

## 投影顺序

```text
Authoritative DisplayState
→ Observer Projection
→ Device Projection
→ Backend Rendering
```

## 设备档案

`vsr.device-profile.v0.1` 包含：

- deviceId；
- deviceClass；
- viewport；
- safeArea；
- inputModes；
- fit；
- orientation。

## 证明边界

每个投影包含：

- sourceDocumentHash；
- sourceDisplayHash；
- deviceProfileHash；
- projectedDisplayHash；
- invariantHash；
- equivalenceHash。

`equivalenceHash` 不包含设备几何，因此同一源现实的多个设备投影必须一致。
