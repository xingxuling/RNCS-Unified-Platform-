# Reality Simulation Runtime（RSR）v0.9.0-alpha.1

RSR是RNCS的三维权威状态、物理接触、角色具身和可验证重放内核。

## v0.9 Stable Embodiment

- 精确Vertical Capsule–OBB碰撞，替代Capsule对旋转Box的AABB近似。
- 法向与摩擦切向冲量跨Tick持久缓存和Warm Start。
- Contact与Joint共同构建确定性Constraint Island。
- 岛级Sleep/Wake，避免相连物体各自进入不一致睡眠。
- Coyote Time和Jump Buffer。
- 保留空间哈希、台阶、Ground Snap、移动平台、单向平台与v0.7权威网络协议。

## 运行

```bash
npm run typecheck
npm run test:spatial-embodiment
npm test
npm run verify:release
```

## 真实性边界

- Capsule仍为Y轴直立胶囊。
- 接触缓存是确定性单点持久流形，不是完整四点/八点工业接触流形。
- 约束求解器仍是单线程整数确定性参考实现，不声称达到Jolt/PhysX/Chaos吞吐量。
