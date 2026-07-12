# Web Host Boundary Inversion v0.4

## Original boundary

A conventional web port treats the browser as the application and rewrites product logic around DOM, origin storage, and web deployment.

## Inverted boundary

The browser is only one host translator. The `.hnac` object remains canonical and arrives with its own identity, content index, signature, execution candidates, capability requests, interface graph, and state schema.

```text
HNAC canonical object
        |
        +-- Python/Wasmtime Component host
        +-- JavaScript/Node Core Wasm host
        +-- Browser/PWA Core Wasm host
        +-- declarative compatibility host
```

## Submodule inversion scan

| Conventional web concept | Hidden ownership boundary | v0.4 inversion |
|---|---|---|
| uploaded ZIP | arbitrary files become trusted after parsing | capsule parser rejects unsafe and duplicate logical paths before use |
| web app manifest | browser shell defines application identity | web manifest describes the host shell; HNAC app identity stays canonical |
| JavaScript permissions | code calls browser API directly | semantic capability lease precedes host adapter materialization |
| localStorage | origin path defines application state | host maps HNAC app identity to an origin-scoped state projection |
| responsive UI | screen width chooses layout | AIP semantic graph is projected into available interaction modes |
| service worker cache | cached shell becomes application source | cache is a materialized host projection and retains capsule provenance |
| WebAssembly import | import name is treated as authority | import is mapped to a declared semantic capability and negotiated lease |
| PWA package | PWA is considered the product | PWA is explicitly marked non-canonical and reversible |
| cross-platform test | screenshots are compared | normalized semantic traces are compared across host implementations |
| browser compatibility | user agent names drive branches | execution profiles, capabilities, resources, and policies drive negotiation |

## Result

The web host can disappear or be replaced without changing the canonical application object. This is the first practical proof of the HNAF ownership inversion: platforms host applications; platforms do not define them.
