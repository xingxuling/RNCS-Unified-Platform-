# RCL Character Genome Bridge

Compatibility dialect that lets RCL source define a stable RNCS Character
Genome. The bridge emits source locations, a schema-valid Genome, an explicit
RAGF request, a shadow RCL program and real RCL bytecode before invoking the
offline Character Phenotype Reference Provider.

```powershell
node src/cli.mjs genome validate examples/lan-tianlin.character.rcl
node src/cli.mjs genome compile examples/lan-tianlin.character.rcl --out output/lan-tianlin
node src/cli.mjs verify output/lan-tianlin
```

Generation creates a candidate asset family. `commit` is separate, requires
`--approve`, verifies every manifest hash and records RNCS authority. The
provider cannot commit or rewrite identity by itself.
