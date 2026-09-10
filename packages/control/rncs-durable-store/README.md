# RNCS Durable Store

Node-only atomic JSON storage primitive. It owns temp-file write, file sync, atomic rename, directory sync, and primary/temp recovery. Callers own schema validation, semantic roots, receipts, and all authority decisions.

This package is a lowering/provider utility, not a canonical world-state owner. A successful store operation never grants commit, promotion, or production authority.
