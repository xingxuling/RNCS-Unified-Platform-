# RNCS Character Phenotype Compiler

Deterministic, offline RAGF reference provider that compiles
`rncs.character-genome.v0.1` into a cross-media character asset family.

The compiler produces real GLB 2.0 geometry, three independently generated
LODs, 21-bone skinning, 28 identity morphs, eight expressions, fourteen
visemes, modular body/face/hair/costume GLBs, texture maps, Native 2D layers,
2.5D depth metadata, and 3D-assisted 2D render passes.

```js
import {createCharacterGenome} from '@taowind/character-genome-runtime';
import {compileCharacterPhenotype} from '@taowind/character-phenotype-compiler';

const genome = createCharacterGenome({name: 'Lan Tianlin', seed: 'lan-v1'});
const build = compileCharacterPhenotype(genome, {outDir: 'tmp/lan'});
console.log(build.validation.valid, build.family.asset_root);
```

Only the explicit `reference` provider is available. It performs no cloud
calls and emits Apache-2.0 provider, build, lineage, continuity, quality, and
evidence receipts. Output is a reference digital actor suitable for contract
and pipeline validation; commercial character art and target-device approval
remain external acceptance gates.
