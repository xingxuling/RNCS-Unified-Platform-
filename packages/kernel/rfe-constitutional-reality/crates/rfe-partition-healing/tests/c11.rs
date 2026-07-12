use rfe_canonical::{parse_json, JsonValue};
use rfe_partition_healing::{PartitionCrashPoint, PartitionHealingCoordinator};
use std::time::{SystemTime, UNIX_EPOCH};

fn required<'a>(value: &'a JsonValue, key: &str) -> &'a JsonValue {
    value.get(key).unwrap_or_else(|| panic!("missing {key}"))
}

fn vector() -> JsonValue {
    parse_json(include_str!(
        "../../../conformance/vectors/c11-partition-healing-reality.json"
    ))
    .expect("C11 vector")
}

fn temporary_root(label: &str) -> std::path::PathBuf {
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("clock")
        .as_nanos();
    std::env::temp_dir().join(format!("rfe-v090-{label}-{nonce}"))
}

fn coordinator(root: &std::path::Path) -> PartitionHealingCoordinator {
    let vector = vector();
    PartitionHealingCoordinator::bootstrap(
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
    .expect("bootstrap C11")
}

#[test]
fn c11_matches_frozen_golden_result() {
    let vector = vector();
    let root = temporary_root("golden");
    let mut coordinator = coordinator(&root);
    let actual = coordinator
        .run_acceptance_scenario(&vector)
        .expect("run C11");
    assert_eq!(
        actual.canonical_string(),
        required(&vector, "expected").canonical_string()
    );
    std::fs::remove_dir_all(root).expect("cleanup");
}

#[test]
fn c11_reopens_and_replays_final_receipt_idempotently() {
    let vector = vector();
    let root = temporary_root("reopen");
    let mut coordinator = coordinator(&root);
    coordinator
        .run_acceptance_scenario(&vector)
        .expect("run C11");
    drop(coordinator);

    let mut reopened = PartitionHealingCoordinator::open(&root).expect("reopen C11 checkpoint");
    let first = reopened.recover().expect("first replay");
    let second = reopened.recover().expect("second replay");
    assert_eq!(first.canonical_string(), second.canonical_string());
    assert_eq!(required(&first, "recovered"), &JsonValue::Bool(true));
    std::fs::remove_dir_all(root).expect("cleanup");
}

#[test]
fn c11_rejects_unsafe_byzantine_quorum_geometry() {
    let vector = vector();
    let root = temporary_root("unsafe");
    let failure = PartitionHealingCoordinator::bootstrap(
        &root,
        required(&vector, "clusters"),
        6,
        3,
        required(&vector, "parentCertificateHash")
            .as_str()
            .expect("parent"),
    )
    .expect_err("unsafe quorum must fail");
    assert_eq!(failure.code, "UNSAFE_BYZANTINE_QUORUM");
}

#[test]
fn c11_crash_point_type_remains_stable() {
    assert_eq!(
        PartitionCrashPoint::AfterCommit(1),
        PartitionCrashPoint::AfterCommit(1)
    );
}
