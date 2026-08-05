# Release and Rollback

## Compatibility

- The RNCS Suite remains `0.19.8-alpha.1`; RSR remains `0.9.0-alpha.1`; VSR remains `0.8.0-alpha.1`.
- Six opt-in `0.1.0-alpha.1` workspace packages are added. Existing RSR, VSR, network, gateway, and core-contract APIs are not replaced.
- Generated artifacts are candidate-only and cannot invoke RNCS/RFE commit authority.
- World Body IR v0.1 is an additive protocol. Consumers must opt in through the declaration/compiler path.

## Release gate

```bash
npm install
npm run verify:world-body
npm run verify:version-contract
```

A release candidate must preserve zero failures in the executable theorem bundles, the RCL subset parity run, codegen replay, selected production differential, and existing authority/presentation integration test.

`verify:world-body` also executes the complete checked-in RSR, VSR, and reality-network-runtime package suites. The much larger full RCL package regression remains a separate `npm run test:rcl` gate; the World Body command always runs its focused RCL reference/native-VM parity test.

The baseline lockfile currently has one high and two moderate production dependency advisories in the existing MCP dependency chain. They are not introduced by World Body packages, but must be handled in a focused, tested MCP SDK upgrade before treating the entire suite as security-clean.

## Rollback

Rollback is additive and low risk:

1. Stop invoking `world-body-codegen` and continue using existing hand-authored RSR/VSR paths.
2. Remove the six World Body workspace entries and root scripts from the candidate change.
3. Remove the candidate documentation and generated example artifacts.
4. Re-run the existing RSR/VSR build and authority-presentation integration test.

No migration mutates durable production state, and no generated candidate is automatically committed. Existing solver, renderer, provider, gateway, and authority code remains the fallback.
