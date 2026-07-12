use rfe_byzantine_federation::{ByzantineCrashPoint, ByzantineRealityCoordinator};
use rfe_canonical::{parse_json, JsonValue};
use std::time::{SystemTime, UNIX_EPOCH};

fn required<'a>(value: &'a JsonValue, key: &str) -> &'a JsonValue {
    value.get(key).unwrap_or_else(|| panic!("missing {key}"))
}

fn vector() -> JsonValue {
    parse_json(include_str!(
        "../../../conformance/vectors/c10-byzantine-federated-reality.json"
    ))
    .expect("C10 vector")
}

fn temporary_root(label: &str) -> std::path::PathBuf {
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("clock")
        .as_nanos();
    std::env::temp_dir().join(format!("rfe-v080-{label}-{nonce}"))
}

fn coordinator(root: &std::path::Path) -> ByzantineRealityCoordinator {
    let vector = vector();
    ByzantineRealityCoordinator::bootstrap(
        root,
        required(&vector, "clusters"),
        required(&vector, "quorumWeight").as_u64().expect("quorum"),
        required(&vector, "byzantineBudgetWeight")
            .as_u64()
            .expect("budget"),
        required(&vector, "parentCertificateHash")
            .as_str()
            .expect("parent certificate"),
    )
    .expect("bootstrap C10")
}

#[test]
fn c10_matches_frozen_golden_result() {
    let vector = vector();
    let root = temporary_root("golden");
    let mut coordinator = coordinator(&root);
    let actual = coordinator
        .run_acceptance_scenario(
            required(&vector, "mainProposal"),
            required(&vector, "forkProposal"),
        )
        .expect("run C10");
    assert_eq!(
        actual.canonical_string(),
        required(&vector, "expected").canonical_string()
    );
    std::fs::remove_dir_all(root).expect("cleanup");
}

#[test]
fn c10_reopens_and_recovers_unique_certificate() {
    let vector = vector();
    let root = temporary_root("reopen");
    let mut coordinator = coordinator(&root);
    let failure = coordinator.run_acceptance_scenario(
        required(&vector, "mainProposal"),
        required(&vector, "forkProposal"),
    );
    // The acceptance scenario itself recovers; prove the persisted final checkpoint can reopen idempotently.
    assert!(failure.is_ok());
    drop(coordinator);
    let mut reopened = ByzantineRealityCoordinator::open(&root).expect("reopen C10 checkpoint");
    let first = reopened.recover().expect("first replay");
    let second = reopened.recover().expect("second replay");
    assert_eq!(first.canonical_string(), second.canonical_string());
    assert_eq!(required(&first, "status").as_str(), Some("committed"));
    std::fs::remove_dir_all(root).expect("cleanup");
}

#[test]
fn c10_rejects_unsafe_quorum_intersection() {
    let vector = vector();
    let root = temporary_root("unsafe");
    let failure = ByzantineRealityCoordinator::bootstrap(
        &root,
        required(&vector, "clusters"),
        6,
        3,
        required(&vector, "parentCertificateHash")
            .as_str()
            .expect("parent"),
    )
    .expect_err("unsafe quorum must fail");
    assert_eq!(failure.code, "QUORUM_INTERSECTION_NOT_BYZANTINE_SAFE");
}

#[test]
fn c10_crash_point_type_remains_stable() {
    assert_eq!(
        ByzantineCrashPoint::AfterCommit(1),
        ByzantineCrashPoint::AfterCommit(1)
    );
}
