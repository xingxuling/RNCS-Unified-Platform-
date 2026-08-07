# RNCS Anime Forge Phase 6.4 Federation Review

Status: implementation branch — human visual acceptance remains pending.
Baseline: `main-95@cce234d7ec2d4eb00cd0e92726c7be2fc866b0ab`.

## Real problem rename

Phase 6.3 established a single morphology authority, implicit morphology field, canonical surface mesh, skinning, surface attachments, depth visibility and measured geometric certificates. The supplied human review frame still fails as a character: geometry is coherent but the output has an oversized/poorly shaped head, weak face semantics, torso as a continuous blob, insufficient hair silhouette, weak garment silhouette and low character-design readability.

The task is therefore not another geometry rewrite. Phase 6.4 inserts a semantic/art-direction layer above geometric truth and before visual acceptance:

`Genome → Morphology Law → Semantic Morphology Target/Profile → Field/Mesh → Pose/Skinning → Visibility → Semantic Anime Grammar → Raster`.

## Skill routing

Primary: V3 System Architecture. Helpers: V1 Software Architecture, V8 Art Architecture, V9 Meta Architecture. Engineering flow: Diagnosing Bugs → Codebase Design → Architecture-Engineering Bridge → Verification → Architecture Review. Production flow: Art Director → Character Design → Technical Art → Creative Production Review.

## Federation gates

1. Founder Twin — visual acceptance is the outcome, not test-count growth.
2. 柳清莲 Gate — Character Genome remains identity authority; art target cannot rewrite identity.
3. Grounding — the Phase 6.3 human-rejected frame becomes an explicit RED semantic regression.
4. Product — preserve native/offline CPU execution.
5. UX — expose semantic failures separately from geometry failures.
6. Character Design — add an explicit CharacterDesignTarget and silhouette/face/garment targets.
7. Animation Director — keep the acceptance motion simple; continuity matters more than spectacle.
8. Art Director — large forms and silhouette precede decorative detail.
9. Anatomy — distinguish skull/face, ribcage/waist/pelvis, arm taper and hand readability.
10. Semantic Modeling — semantic certificate is independent of geometric certificate.
11. Geometry/Topology — Phase 6.3 field/mesh kernel is preserved.
12. Technical Art — refinements happen upstream of rendering; renderer has no anatomy authority.
13. Anime Grammar — v0.3 is readability-first and head-relative for face/hair rendering.
14. Mathematics — every semantic gate carries measurement, range, method and evidence root.
15. Engineering — vertical slice starts with a baseline RED oracle.
16. Code — new deep modules; no second identity/morphology authority.
17. Test — existing geometric suite remains intact; semantic tests are additive.
18. Performance — CPU/AMD remains a supported acceptance path.
19. Security — no model weights, remote providers or secrets are introduced.
20. Release — PR/CI before mainline merge.
21. Integration Court — Phase 6.4 may be merged as engineering foundation while human visual acceptance remains pending, but cannot claim commercial Anime quality.
22. Evidence Ledger — geometry roots, semantic target/profile/certificate, human review, regression, frames and media are bound separately.

## Design-it-twice decision

Rejected route: tighten Phase 6.3 geometry thresholds until one screenshot looks less strange. This would overfit and conflate geometric legality with character design.

Selected route: preserve geometric truth and introduce a `CharacterDesignTarget + SemanticMorphologyProfile + SemanticMorphologyCertificate` deep module. Semantic constraints drive proportion/surface refinement before field/mesh generation. The renderer only consumes accepted geometry and sizes face/hair details relative to the actual projected head.

## Hard boundaries

- No external visual model in the acceptance path.
- No renderer-side anatomy repair.
- No automatic human acceptance.
- Geometric certificate PASS may coexist with semantic certificate FAIL.
- Human review remains the final creative-production gate.
