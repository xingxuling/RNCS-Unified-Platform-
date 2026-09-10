# RNCS Content-Addressed Asset Cache

Node-only runtime cache provider for binary asset payloads. It stores payloads by SHA-256, verifies byte length and content on every read, rehydrates only from a root-checked manifest, writes through synced temporary files, and trims resident bytes with deterministic LRU ordering.

The provider owns discardable cache bytes and diagnostics only. It does not own canonical world state, asset selection, VSR leases, authority, promotion, or commit. The cache can be deleted and rebuilt from the caller's source loader.

`format` and `version` can be supplied by an integration wrapper so an existing domain format remains stable while implementation ownership moves here. The current provider is Node-only; browser Cache Storage/IndexedDB and Android app-private providers remain separate platform lowerings.
