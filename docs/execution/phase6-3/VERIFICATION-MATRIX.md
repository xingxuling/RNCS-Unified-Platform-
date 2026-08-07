# Phase 6.3 Verification Matrix

| Gate | Evidence | RED source | GREEN condition | Claim boundary |
| --- | --- | --- | --- | --- |
| Measured Phase 6.2 rejection | `phase6-2-failure-measurements.json` | supplied rejection frame and old contour output | named metrics fail with measured values | proves regression, not visual score |
| Proportion law | constraint solution and ratio report | unconstrained Phase 6.2 dimensions | ratios in allowed ranges or explicit reject | does not prove aesthetics |
| Field continuity | canonical field report | disconnected primitive volumes | field samples have no illegal breaks in required regions | bounded resolution |
| Mesh topology | canonical mesh JSON | no mesh in Phase 6.2 | connected components and bounded boundaries meet policy | not production retopology |
| Surface skinning | posed mesh report | pose-specific contour landmarks | bones drive pose and joints stay connected | CPU deterministic path |
| Face attachment | attachment report | point/renderer-owned anchors | feature attachment and containment pass | human review still needed |
| Scalp and hair | scalp/hair report | local hair polygons | roots stay within epsilon and masses connect | not hair simulation |
| Garment surface | garment report | torso contour scaling | clearance and penetration pass | not cloth simulation |
| Visibility | depth and IDs | no depth buffers | depth order and occlusion are measured | raster resolution bounded |
| Camera projection | projected frame and report | 2D contour projection | camera output is derived from posed surface | not a quality grade |
| Anime grammar | grammar report | style-only body read | styling runs after geometry and visibility | no anatomy authority |
| Property fuzz | raw summary and samples | structural-only checks | 9,000 cases evaluate laws/topology/attachments/visibility | targeted automated coverage |
| Studio desktop/mobile | browser evidence | no geometric truth workspace | required states visible without overlap | browser environment only |
| Final media | MP4, WAV, ffprobe, hashes | placeholder media risk | real decodable media and replay evidence | only after static gates |
| Human visual review | signed review record | pending | explicit reviewer acceptance | not automatable |

## Required metrics

The RED oracle and the final report must measure:

`projected_head_to_shoulder_ratio`, `head_to_torso_ratio`, `neck_to_skull_connectivity`, `neck_to_ribcage_connectivity`, `shoulder_symmetry_at_neutral`, `face_feature_surface_containment`, `eye_depth_order_under_yaw`, `nose_depth_relative_to_face`, `mouth_plane_alignment`, `hair_root_to_scalp_distance`, `hair_mass_connected_to_root`, `hand_to_wrist_connectivity`, `limb_surface_connected_components`, `whole_body_connected_components`, `surface_self_intersection_count`, `silhouette_disconnected_islands`, `visible_feature_occlusion_correctness`, and `projected_anatomical_ratio_validity`.

## Evidence rule

Every certificate gate must include `measurement`, `allowed`, `method`, `evidence_root`, and `pass`. A field or mesh implementation without corresponding evidence is incomplete.
