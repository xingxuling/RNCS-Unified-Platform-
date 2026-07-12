use rfe_canonical::{parse_json, JsonValue};
use rfe_federated_consensus::{FederatedRealityCoordinator, FederationCrashPoint};
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
    std::env::temp_dir().join(format!("rfe-v070-{label}-{nonce}"))
}

fn vector() -> JsonValue {
    parse_json(include_str!(
        "../../../conformance/vectors/c9-federated-reality-consensus.json"
    ))
    .expect("C9 vector")
}

fn coordinator(root: &std::path::Path) -> FederatedRealityCoordinator {
    let vector = vector();
    FederatedRealityCoordinator::bootstrap(
        root,
        required(&vector, "clusters"),
        required(&vector, "quorumWeight")
            .as_u64()
            .expect("quorum weight"),
    )
    .expect("bootstrap C9 coordinator")
}

#[test]
fn c9_matches_frozen_golden_result() {
    let vector = vector();
    let root = temporary_root("golden");
    let mut coordinator = coordinator(&root);
    let result = coordinator
        .run_acceptance_scenario(
            required(&vector, "noQuorumProposal"),
            required(&vector, "commitProposal"),
        )
        .expect("run C9 scenario");
    assert_eq!(
        result.canonical_string(),
        required(&vector, "expected").canonical_string()
    );
    std::fs::remove_dir_all(root).expect("remove C9 store");
}

#[test]
fn c9_reopens_and_recovers_durable_quorum_certificate() {
    let vector = vector();
    let root = temporary_root("reopen");
    let mut coordinator = coordinator(&root);
    let failure = coordinator
        .execute_proposal(
            required(&vector, "commitProposal"),
            FederationCrashPoint::AfterCommit(1),
        )
        .expect_err("commit crash");
    assert_eq!(failure.code, "FEDERATION_CRASH_INJECTED_AFTER_COMMIT");
    drop(coordinator);

    let mut reopened = FederatedRealityCoordinator::open(&root).expect("reopen checkpoint");
    let first = reopened
        .recover("proposal:c9:commit-after-recovery")
        .expect("recover commit");
    let second = reopened
        .recover("proposal:c9:commit-after-recovery")
        .expect("idempotent replay");
    assert_eq!(first.canonical_string(), second.canonical_string());
    assert_eq!(required(&first, "status").as_str(), Some("committed"));
    std::fs::remove_dir_all(root).expect("remove C9 store");
}

#[test]
fn c9_aborts_prepares_without_quorum_certificate() {
    let vector = vector();
    let root = temporary_root("abort");
    let mut coordinator = coordinator(&root);
    let pending = coordinator
        .execute_proposal(
            required(&vector, "noQuorumProposal"),
            FederationCrashPoint::None,
        )
        .expect("pending proposal");
    assert!(matches!(required(&pending, "decision"), JsonValue::Null));
    let receipt = coordinator
        .recover("proposal:c9:no-quorum")
        .expect("abort recovery");
    assert_eq!(required(&receipt, "status").as_str(), Some("aborted"));
    std::fs::remove_dir_all(root).expect("remove C9 store");
}
