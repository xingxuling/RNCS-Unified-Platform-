# Phase 6.6 First-Run Triage

This file exists because the current GitHub Actions provider is blocked before runner start by an account-level billing/spending-limit condition. When execution returns, failures must be diagnosed by layer instead of weakening gates.

## Triage order

### 1. `LOWER_BODY_FIELD_REJECTED:FIELD_DISCONNECTED_COMPONENTS`

Meaning: the new pelvis/hip/thigh/knee/shin/foot implicit fields do not form one connected morphology field.

Inspect:
- `field_validation.connected_components`
- pelvis ↔ hip rest-center distance
- hip ↔ thigh, thigh ↔ knee, knee ↔ shin, shin ↔ foot extent overlap
- field blend radii

Allowed repair:
- adjust lower-body canonical volume placement/radii or introduce a true anatomical bridge field.

Forbidden repair:
- disable the connected-component gate
- draw legs only in the renderer

### 2. `LOWER_BODY_MESH_REJECTED:MESH_CONNECTED_COMPONENTS_INVALID`

Meaning: the continuous field is connected, but the chosen mesh sampling profile failed to extract a connected surface.

Inspect:
- field bounds
- mesh resolution
- smallest ankle/foot cross-section vs grid spacing
- `topology_report`

Allowed repair:
- use an adaptive/full-body sampling profile
- increase physically valid minimum lower-body volume thickness

Forbidden repair:
- accept disconnected canonical mesh

### 3. `LOWER_BODY_CERTIFICATE_REJECTED:lower_body_foot_attachment`

Meaning: canonical mesh did not produce nonzero bilateral `thigh/shin/foot` skin-weight evidence.

Inspect:
- field descriptors exist
- mesh vertices near foot/shin
- `bone_weights`
- interpolation/field ownership at the zero crossing

Note: region labels are diagnostic only; the hard gate is real bone-weight binding.

### 4. `LOWER_BODY_GEOMETRY_CERTIFICATE_REJECTED`

Meaning: Phase 6.3 geometric truth gate failed after the full-body extension.

Do not bypass. Compare:
- connected components
- self intersections
- projected ratio target
- attachment metrics

### 5. `LOWER_BODY_SEMANTIC_CERTIFICATE_REJECTED`

Meaning: geometry is legal but Semantic Anatomy / CharacterDesignTarget does not accept the full-body candidate.

Repair in Semantic Morphology / art-directed target space, not renderer pixels.

### 6. `WEIGHTED_NATIVE_SURFACE_WEIGHTING_REJECTED`

Meaning: FieldGuidedSurfaceWeights failed normalization/cardinality or produced zero multi-bone vertices.

Inspect:
- `multi_influence_vertices`
- `multi_influence_ratio`
- max influences (must be <= 4)
- primary bone retention
- field extent/padding near shoulder, elbow, hip and knee

Do not claim smooth skinning unless multi-bone evidence exists.

### 7. `DRAWING_MESH_INVERSION`

Meaning: 2D DrawingMesh cage deformation flipped one or more triangles.

Repair:
- reduce/control local cage offset
- change control topology
- localize deformation

Do not disable inversion rejection.

### 8. `FULL_BODY_DRAWING_CERTIFICATE_REJECTED`

Meaning: canonical lower-body geometry exists, but projected character drawing fails visual-structure gates such as leg taper, ankle/foot attachment or full-body height readability.

Repair in FullBodyCharacterDrawing / DrawingIR. Do not mutate Canonical Anatomy merely to satisfy a screen-space artifact unless the geometry itself is wrong.

### 9. `FULL_BODY_PRESENTATION_GATE_FAILED`

Meaning: downstream framing transform produced an invalid DrawingIR.

Presentation may translate/scale the already-certified drawing, but must preserve:
- `drawing_root`
- `full_body_drawing_certificate_root`
- identity and morphology roots

### 10. `VECTOR_TOOL_NOT_FOUND` / `FFMPEG_FAILED`

Execution-environment failure. Do not downgrade to old raster and call Phase 6.6 passed.

## Human review after GREEN

Even if every automated gate passes, inspect at minimum:

- Front neutral
- 3/4 neutral/action
- Profile
- frame 60 action pose
- full 5-second MP4

Human review must explicitly check:

- full-body silhouette reads as one character
- hips/legs/feet do not look appended after the fact
- shoulder/elbow/knee deformation is not mechanical
- hands/feet remain attached
- 3/4 face remains contained
- hair remains attached
- drawing curves look materially better than Phase 6.5 raster baseline
- no fake lower-body or off-screen clipping

Automated GREEN never writes `human_visual_acceptance=accepted`.
