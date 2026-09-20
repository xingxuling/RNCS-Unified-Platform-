# RNCS HER v0.3 Architecture

```text
Input Layer
├─ WanFeng Motion IR
├─ MediaPipe landmarks
├─ BVH mocap
└─ glTF humanoid rig
      ↓
Canonicalization
├─ Canonical Human Skeleton
├─ World Joint Map
└─ Local Quaternion Pose
      ↓
Embodiment Solver
├─ Deterministic FK
├─ Limb IK
├─ Full-Body Constraint Orchestrator
├─ Swing/Twist Joint Limits
├─ Root Motion
└─ Foot Plant
      ↓
Evidence / Calibration
├─ End-effector residual
├─ Joint-angle residual
├─ COM / support polygon
├─ contact evidence
└─ per-frame validity
      ↓
RNCS Surfaces
├─ RSR spatial-embodiment.v0.6
├─ VSR spatial-reality-3d.v0.7
├─ VSR temporal-presentation.v0.6
├─ VSR skinned-mesh-frame.v0.3 extension
└─ World Body IR Human v0.3
      ↓
RCL Gate / upper domains
```

## Design rule

HER owns human motion semantics. RSR owns authoritative spatial/physical state. VSR owns presentation. RCL owns evidence-bearing constraints and permission/certification gates. Renderer libraries remain replaceable providers rather than becoming the human-motion authority.
