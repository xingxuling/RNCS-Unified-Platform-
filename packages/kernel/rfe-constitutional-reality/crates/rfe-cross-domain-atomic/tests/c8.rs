use rfe_canonical::{parse_json, JsonValue};
use rfe_cross_domain_atomic::{AtomicCrashPoint, AtomicRealityCoordinator};
use std::time::{SystemTime, UNIX_EPOCH};

fn required<'a>(value: &'a JsonValue, key: &str) -> &'a JsonValue {
    value
        .get(key)
        .unwrap_or_else(|| panic!("missing key: {key}"))
}

fn temporary_root(label: &str) -> std::path::PathBuf {
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("clock")
        .as_nanos();
    std::env::temp_dir().join(format!("rfe-v060-{label}-{nonce}"))
}

fn vector() -> JsonValue {
    parse_json(include_str!(
        "../../../conformance/vectors/c8-cross-domain-atomic.json"
    ))
    .expect("C8 vector")
}

#[test]
fn c8_matches_frozen_golden_result() {
    let vector = vector();
    let root = temporary_root("golden");
    let coordinator = AtomicRealityCoordinator::bootstrap(&root, required(&vector, "participants"))
        .expect("bootstrap C8 coordinator");
    let result = coordinator
        .run_acceptance_scenario(
            required(&vector, "abortTransaction"),
            required(&vector, "commitTransaction"),
        )
        .expect("run C8 scenario");
    assert_eq!(
        result.canonical_string(),
        required(&vector, "expected").canonical_string()
    );
    std::fs::remove_dir_all(root).expect("remove C8 store");
}

#[test]
fn c8_aborts_without_a_durable_decision() {
    let vector = vector();
    let root = temporary_root("abort");
    let coordinator = AtomicRealityCoordinator::bootstrap(&root, required(&vector, "participants"))
        .expect("bootstrap C8 coordinator");
    let initial_root = coordinator.current_global_root().expect("initial root");
    let failure = coordinator
        .execute_transaction(
            required(&vector, "abortTransaction"),
            AtomicCrashPoint::AfterPrepare(2),
        )
        .expect_err("prepare crash");
    assert_eq!(failure.code, "ATOMIC_CRASH_INJECTED_AFTER_PREPARE");
    let receipt = coordinator
        .recover("transaction:c8:abort-before-decision")
        .expect("abort recovery");
    assert_eq!(required(&receipt, "status").as_str(), Some("aborted"));
    assert_eq!(
        coordinator.current_global_root().expect("root"),
        initial_root
    );
    std::fs::remove_dir_all(root).expect("remove C8 store");
}

#[test]
fn c8_commits_all_domains_after_durable_decision() {
    let vector = vector();
    let root = temporary_root("commit");
    let coordinator = AtomicRealityCoordinator::bootstrap(&root, required(&vector, "participants"))
        .expect("bootstrap C8 coordinator");
    let failure = coordinator
        .execute_transaction(
            required(&vector, "commitTransaction"),
            AtomicCrashPoint::AfterCommit(1),
        )
        .expect_err("commit crash");
    assert_eq!(failure.code, "ATOMIC_CRASH_INJECTED_AFTER_COMMIT");
    let first = coordinator
        .recover("transaction:c8:commit-after-recovery")
        .expect("commit recovery");
    let second = coordinator
        .recover("transaction:c8:commit-after-recovery")
        .expect("idempotent recovery");
    assert_eq!(first.canonical_string(), second.canonical_string());
    assert_eq!(required(&first, "status").as_str(), Some("committed"));
    for domain_id in ["domain:economy", "domain:identity", "domain:world"] {
        let state = coordinator
            .participant_state(domain_id)
            .expect("participant state");
        assert_eq!(required(&state, "phase").as_str(), Some("stable"));
        assert_eq!(required(&state, "revision").as_u64(), Some(1));
    }
    std::fs::remove_dir_all(root).expect("remove C8 store");
}
