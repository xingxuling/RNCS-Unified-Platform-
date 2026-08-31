# Changelog

## 0.1.0-alpha.4

- Added durable bundle export/restore across a JSON restart boundary, including applied-delta receipts for idempotency recovery and explicit restore authority.

## 0.1.0-alpha.3

- Added canonical Snapshot/Delta replication between isolated runtime instances with base-root checks, ordered event/fact replay, idempotent duplicate detection, and explicit authority receipts.
- Added a second wireframe-grid URRF representation candidate and explicit provider selection for materialization.

## 0.1.0-alpha.2

- Bound canonical World Time, authority-gated World Events, and Fact World Tree roots to the region runtime.

## 0.1.0-alpha.1

- Added deterministic region and chunk generation.
- Added bounded streaming observations, replay, and URRF materialization bridge.
