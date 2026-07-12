# Verification Matrix

| Capability | Evidence |
|---|---|
| Deterministic bytecode | Same source produces byte-identical RBC |
| Native execution | C binary runs RBC without Node.js |
| Transaction parity | State, projection/history counts and reality roots match reference runtime |
| Simultaneous change | Native swap test yields 2/1, not 2/2 |
| Authority | Native `CHECK_WARRANT` executes before commit |
| Safety | Native preserve violation exits with `RCL_REALITY_BOUND_BROKEN` |
| Honest boundary | Domain programs return `RCL_NATIVE_DOMAIN_PROVIDER_REQUIRED` at compile time |
| Self-host seed | RCL seed lowers literal assignment and second RBC runs to `world.value = 7` |
| Memory safety proxy | ASan/UBSan hello and compiler-seed runs complete without reports |
