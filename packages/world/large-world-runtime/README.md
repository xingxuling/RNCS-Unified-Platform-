# Large World Runtime

`@taowind/large-world-runtime` is the first bounded large-world vertical slice for RNCS. It keeps the world body canonical in RNCS and treats URRF/VSR as representation and projection layers.

The runtime provides deterministic `WorldSeed → Region → Chunk` generation, integer-rooted terrain meshes, a bounded active chunk working set with load/unload hysteresis, URRF candidate materialization, canonical World Time/Event/Fact roots, and replayable streaming evidence.

This alpha proves a 9×9 region by default. It does not claim an MMO-scale distributed world, GPU generation, persistent storage, external Spark execution, or production delivery.
