# URRF Large-World Portfolio — Local Evidence

- world_root: `e8c28e751ac1d75267d24be97fa0bb34137441d0e4ac83081684e68d330d2af4`
- stream_root: `fe468b3982f44162b404f3826e8bf613a08e99c91b50d06b6238bb1402e33cf4`
- materialization_root: `2eeca64a497bd5fab0299f1cdb113e43993d2dd20732413734fc317ac41f9b5a`
- portfolio_count: 9 (one candidate portfolio per active chunk)
- report_root: `0a172e1b185bcbc75629bc4de05e0f8e1b74e998c25ccd3700264bb36d634b08`
- status: `LOCAL_RENDERED / OBSERVED_NOT_GRADED`

| Sample | Active chunks | Selected profiles | PNG | Pixel root | Frame root |
|---|---:|---|---|---|---|
| mixed | 9 | PROXY×8 + STANDARD×1 | [large-world-region-mixed.png](./large-world-region-mixed.png) | `391b156080bbced86ebb4b81ccd51b4e8ea4770e714b0c54340d9f48d049490c` | `857bc37915355121b7a0cb35297929322ab351216b377e92ace0d960a06cea60` |
| proxy-fallback | 9 | PROXY×9 (zero-budget fallback) | [large-world-region-proxy-fallback.png](./large-world-region-proxy-fallback.png) | `f45e9e5baa2c46a2e86f646e2da0a5f959c4d9fbe6cfe7a7930cf260d4a2bda3` | `1bb70d9a7e6ab894f4b488403d9d7c1178295dc3e81a72fb2a507be44d4c4246` |

Each chunk portfolio contains a STANDARD procedural-grid slot and a PROXY wireframe-grid slot when both URRF references are present. Selection and fallback receipts remain candidate-only; RNCS retains canonical world-state authority.

The PNGs are deterministic CPU-reference projections. They are evidence of a runnable multi-region integration, not a production renderer-quality grade.
