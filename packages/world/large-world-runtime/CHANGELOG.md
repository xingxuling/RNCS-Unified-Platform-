# Changelog

## Unreleased

- Added optional v0.3 Consistency Profile and RNCS Authority Lease/Epoch/Fencing admission to two-node Snapshot/Delta replication, with stale/expired/revoked lease rejection and receipt-bound fencing evidence.

## 0.1.0-alpha.7

- Added an atomic temporary-file/rename durable store with file-sync receipts and deterministic crash-point recovery for durable bundles.

## 0.1.0-alpha.6

- Added a deterministic lexicographic-writer conflict court for same-base replication candidates, explicit winner/loser decisions, authoritative application receipts, and durable loser gates.

## 0.1.0-alpha.5

- Added authenticated Snapshot/Delta packet envelopes and a bounded ack/retry link with transport sequence, packet-loss tolerance, duplicate handling, and explicit route validation.

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
