use rfe_canonical::{parse_json, JsonValue};
use rfe_replicated_authority::ReplicatedAuthorityCluster;
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
    std::env::temp_dir().join(format!("rfe-v050-{label}-{nonce}"))
}

fn run_c7(label: &str) -> (std::path::PathBuf, JsonValue, JsonValue) {
    let vector = parse_json(include_str!(
        "../../../conformance/vectors/c7-replicated-authority.json"
    ))
    .expect("C7 vector");
    let root = temporary_root(label);
    let cluster = ReplicatedAuthorityCluster::bootstrap(
        &root,
        required(&vector, "bootstrap"),
        required(&vector, "session"),
        required(&vector, "cluster"),
    )
    .expect("bootstrap C7 cluster");
    let result = cluster.run_acceptance_scenario().expect("run C7 scenario");
    (root, vector, result)
}

#[test]
fn c7_matches_frozen_golden_result() {
    let (root, vector, result) = run_c7("golden");
    assert_eq!(
        result.canonical_string(),
        required(&vector, "expected").canonical_string()
    );
    std::fs::remove_dir_all(root).expect("remove C7 store");
}

#[test]
fn c7_log_chain_is_monotonic_across_failover() {
    let (root, _, result) = run_c7("log-chain");
    let entries = required(&result, "authorityLog")
        .as_array()
        .expect("authority log");
    assert_eq!(entries.len(), 3);
    assert_eq!(required(&entries[0], "term").as_u64(), Some(1));
    assert_eq!(required(&entries[1], "term").as_u64(), Some(1));
    assert_eq!(required(&entries[2], "term").as_u64(), Some(2));
    assert_eq!(required(&entries[0], "previousEntryHash"), &JsonValue::Null);
    assert_eq!(
        required(&entries[1], "previousEntryHash").as_str(),
        required(&entries[0], "entryHash").as_str()
    );
    assert_eq!(
        required(&entries[2], "previousEntryHash").as_str(),
        required(&entries[1], "entryHash").as_str()
    );
    std::fs::remove_dir_all(root).expect("remove C7 store");
}

#[test]
fn c7_rejects_stale_leader_and_converges_healthy_replicas() {
    let (root, _, result) = run_c7("convergence");
    let stale = required(&result, "staleLeaderRejection");
    assert_eq!(required(stale, "status").as_str(), Some("rejected"));
    assert_eq!(
        required(stale, "reasonCode").as_str(),
        Some("stale_leader_term")
    );
    let convergence = required(&result, "healthyConvergence");
    assert_eq!(required(convergence, "converged"), &JsonValue::Bool(true));
    assert_eq!(required(convergence, "identityCount").as_u64(), Some(1));
    assert_eq!(required(&result, "finalLeader").as_str(), Some("replica:b"));
    assert_eq!(required(&result, "finalTerm").as_u64(), Some(2));
    std::fs::remove_dir_all(root).expect("remove C7 store");
}
