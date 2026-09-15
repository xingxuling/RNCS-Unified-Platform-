# RNCS Reality Studio — Game World Engine Productization Evidence v0.1

Recorded: 2026-09-15
Checkout: `C:\Users\User\Documents\RCL\_worktrees\rncs-visual-factory-v01`
Branch: `codex/rncs-engine-stack-archaeology-v01`
Baseline before this pass: `bfca1107b3d733802c315df15d2fc4479d4b9bce`
GitHub Actions used: `false`

## Visual baseline and honest generation status

The supplied reference image remains the accepted visual baseline:

`C:\Users\User\Downloads\ChatGPT Image 2026年9月15日 上午01_27_59.png`

Two Image Gen attempts were made for a new future-style game-world-engine reference. Both failed with a network error, and the local environment does not have `OPENAI_API_KEY`. No generated image is claimed or used as runtime evidence. The current browser render is the real implementation reference for this pass.

## Product decision

Position the product as a deterministic multiplayer game world engine and its authoring/control surface. The product shell now speaks in terms of game world, scene and assets, gameplay and branches, multiplayer, Tick/Players, sync, world projection and promotion gates. Technical owners retain their canonical names where those names identify real RNCS contracts.

## Reuse / adapt / keep separate

| Surface | Decision | Evidence boundary |
| --- | --- | --- |
| Runtime state and commands | REUSE | `RealityStudioAdapter.inspect()` and `command()` remain the only source for runtime, graph, Gate, Evidence, Replay and Viewport state. |
| Reality Kernel, World Body IR, RSR Runtime | KEEP SEPARATE | Existing RNCS/RSR/World Body owners are not copied into the web Product Body. |
| Behavior Fabric, Network Runtime, Authority Fabric | KEEP SEPARATE | Existing behavior/network/authority implementations continue to own execution and authority. |
| Reality Graph nodes, edges and branch rows | REUSE + ADAPT | The UI only changes labels, grouping, selection emphasis and projection styling; node and edge data remain Adapter-provided. |
| VSR / RSR viewport | REUSE | The image, frame root, pixel root, viewport root and verification state remain response-backed. |
| Inspector and Evidence console | ADAPT | Summary-first presentation, folded details, real event summaries and local filtering; no synthetic rows or metrics. |
| Game-world product IA | ADAPT | HTML/CSS/JS projection copy and grouping only; no new canonical semantic module. |
| New game engine semantics | KEEP SEPARATE / GAP | Physics, input, controller/animation, external transport, production authority and persistence are not invented in this pass. |

## Product Body changes

- Reframed brand and metadata as a deterministic multiplayer game world engine.
- Reorganized navigation into World Project, Game World, Gameplay & Branches, Evidence & Authority, Multiplayer and World Projection.
- Added real top-level telemetry for Game World, Tick/Players and Behavior/Network sync alignment while retaining Branch and Gate readiness.
- Reframed the graph as `Authoritative Server → Candidate Branch → Promotion Gate` with scene/input and world-projection zones.
- Reframed the lower projection as `VSR / RSR World Viewport` and kept expand mode projection-only.
- Preserved the truthful unavailable states for Agent Hub, external transport, runtime resource metrics, persistence, production promotion and other unimplemented capabilities.
- Added mobile-only fit scaling for real graph nodes and edges. It changes only the Product Body projection and does not hide nodes or mutate runtime state.

## Browser evidence

Verifier: local Python Playwright Chromium fallback; built-in Browser channel was unavailable.
Screenshots:

- `C:\Users\User\.codex\visualizations\2026\09\15\rncs-reality-studio\game-world-engine-initial-fit.png`
- `C:\Users\User\.codex\visualizations\2026\09\15\rncs-reality-studio\game-world-engine-runtime-path-committed-fit.png`
- `C:\Users\User\.codex\visualizations\2026\09\15\rncs-reality-studio\game-world-engine-mobile-fit.png`
- `C:\Users\User\.codex\visualizations\2026\09\15\rncs-reality-studio\game-world-engine-native-reference-size.png`

Observed at 1680×946:

- Runtime: healthy; control: paused; Tick/Players: `0 · 2`; sync: `ALIGNED`.
- Reality Graph: 14 real nodes, 16 real edges, 16 SVG edge markers, 3 real branch cards.
- VSR / RSR World Viewport: `VERIFIED`; image is the real `640×360` projection response.
- Selecting `RSR Runtime` changes the real Inspector selection and related-edge emphasis.
- Run 6 ticks, isolated Behavior + Network Replay, propose candidate, authorize, then local commit all completed through the live Adapter path.
- After local commit, Gate reads `本地候选已提交`; production promotion remains `production promotion unavailable`.
- Page errors during the verified path: `0`.

Observed at 390×844:

- No horizontal document overflow; all 14 real graph nodes remain in the Product Body graph after fit scaling.
- Vertical page scrolling remains intentional for the desktop-density surface.
- VSR status remains `VERIFIED`; page errors: `0`.

Observed at 2880×1800 (reference-image native canvas size):

- Document width and height equal the viewport; no horizontal or vertical overflow.
- All 14 real graph nodes render and VSR remains `VERIFIED`; page errors: `0`.

## Verification

- `node --check apps/reality-studio/web/reality-studio.js`: PASS
- Focused web, adapter and server tests: **18/18 PASS**
- `git diff --check`: PASS; only existing LF→CRLF normalization warnings.
- No GitHub Actions run.

## Fidelity review against the supplied concept image

| Comparison point | Render result | Decision |
| --- | --- | --- |
| Palette and contrast | Navy/blue-black shell with cyan structure, teal healthy state, amber pending state and restrained red failure state are visible in the browser render. | Kept and tightened in the projection tokens. |
| Primary composition | The central graph occupies the main visual field; Inspector remains a right-side decision panel and VSR/RSR remains a lower projection panel. | Kept as the dominant desktop hierarchy. |
| Graph semantics | The three-layer path is now `Authoritative Game World → Candidate Branches → Commit / Promotion Path`, with real edge selection emphasis and real branch cards. | Adapted copy and styling; reused Adapter graph state. |
| Product navigation | The left rail reads as World Project / Game World / Gameplay & Branches / Multiplayer / Evidence & Authority / World Projection rather than a generic IDE tree. | Adapted IA labels only. |
| Runtime truth | Tick, players, sync alignment, branch, Gate, Replay, node status, roots and viewport verification are response-backed; unavailable capabilities remain visible. | No fake metrics or success states introduced. |
| Viewport role | The VSR/RSR panel has a larger visual role and contains the real verified image and roots. | Kept; richer game-world imagery remains a runtime/provider gap. |

Intentional deviations: the generated future-style concept could not be produced because the Image Gen service returned network errors and no local API key is configured; the current VSR projection remains the real adapter-provided 640×360 output rather than a fabricated cinematic scene; mobile retains vertical scrolling because this is a desktop-density authoring surface.

## Truthful gaps

- New generated future-style reference image: `NOT_AVAILABLE` because Image Gen network calls failed and no local key is configured.
- Current real Studio path is a local deterministic loopback runtime; public WAN/WebSocket/UDP/QUIC/WebRTC/TLS/relay transport remains unavailable.
- Production deployment and external authority/key custody remain unavailable.
- CPU, memory, GPU and FPS provider metrics are unavailable from the current Adapter API.
- Agent Hub, global search, open/save persistence and independent graph camera APIs remain unavailable.
- Canonical combined Behavior + Network tick/receipt ownership remains an RCL/RNCS gap; current integrated replay is isolated candidate evidence.
- A broader game-engine product still needs explicit runtime-owned coverage and evidence for physics/collision, player input, character controller/animation, asset/scene streaming and production server scale.
- The broader gateway health report remains degraded where the sparse checkout lacks `@taowind/rncs-asset-cache`; this pass did not change or conceal that condition.

## RCL stress mapping

Stress case: move an existing reality-control projection toward a game-world-engine product surface without duplicating runtime semantics or fabricating state.
Affected K400 cells: `CORRECT`, `ROBUST`, `EVIDENCE`.
Lowering/provider boundary: HTML/CSS/JS is Product Body projection; RNCS/RFE/RSR/VSR/Behavior/Network/Authority/Evidence remain the owners.
Candidate absorption: not proposed.

## Next highest-leverage pass

Audit the existing game-specific runtime surfaces for real input, spatial bodies, character/controller and asset-streaming contracts; expose only the smallest already-owned capabilities through the Studio Adapter, then add a real player/entity workflow with positive, negative and replay evidence. Keep production networking and promotion explicitly unavailable until their external owners and receipts exist.
