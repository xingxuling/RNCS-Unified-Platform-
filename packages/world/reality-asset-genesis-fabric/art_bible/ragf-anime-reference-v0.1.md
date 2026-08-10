# RAGF Anime Reference Art Bible v0.1

## Visual target

Readable cold-gray supernatural courtroom Anime blocking: stable silhouette, restrained blue-silver palette, fixed dark line weight, three clear shade bands, authored key poses and explicit mouth/eye/hand/pose sheets.

## Continuity rules

- Character identity, palette roles and line style remain stable across front, side, back, expression, mouth and pose sheets.
- The same Character Genome must drive the vector views and the raster front view; PNG is real media evidence, not a test card or text-only placeholder.
- Expression, mouth shape, eye state, gaze and pose are state inputs. Their media roots may change, while identity, palette, proportion and appearance roots must remain stable.
- Background depth layers retain camera-facing landmarks and named parallax roles.
- Voice identity drives viseme timing; the renderer must close the mouth at the final dialogue frame.
- Director motion overrides are bounded by layer and frame range and never replace asset identity.

## Quality gates

- `front-view.svg`, `side-view.svg` and `back-view.svg` must contain a readable body silhouette, costume mass, face or hair treatment, hands and feet.
- `front-view.png` must be a valid non-empty RGBA PNG with a recorded byte length and media root.
- Provider receipts must declare both `image/svg+xml` and `image/png` for the upgraded built-in character provider.
- Human visual acceptance remains separate from deterministic machine gates.

## Boundary

The built-in family is deterministic experimental SVG and PNG reference output. It does not claim finished production drawings, licensed external art, a complete facial/cloth simulation or commercial TV quality.
