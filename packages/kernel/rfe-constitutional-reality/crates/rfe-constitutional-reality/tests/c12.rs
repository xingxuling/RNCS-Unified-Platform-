use rfe_canonical::{parse_json, JsonValue};
use rfe_constitutional_reality::{
    verify_constitutional_result, ConstitutionalCoordinator, ConstitutionalCrashPoint,
};
use std::time::{SystemTime, UNIX_EPOCH};

fn required<'a>(value: &'a JsonValue, key: &str) -> &'a JsonValue {
    value.get(key).unwrap_or_else(|| panic!("missing {key}"))
}

fn vector() -> JsonValue {
    parse_json(include_str!(
        "../../../conformance/vectors/c12-constitutional-reality.json"
    ))
    .expect("C12 vector")
}

fn temporary_root(label: &str) -> std::path::PathBuf {
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("clock")
        .as_nanos();
    std::env::temp_dir().join(format!("rfe-v100-{label}-{nonce}"))
}

#[test]
fn c12_matches_frozen_golden_result() {
    let vector = vector();
    let root = temporary_root("golden");
    let mut coordinator = ConstitutionalCoordinator::bootstrap(&root, &vector).expect("bootstrap");
    let actual = coordinator
        .run_acceptance_scenario(&vector)
        .expect("run C12");
    assert_eq!(
        actual.canonical_string(),
        required(&vector, "expected").canonical_string()
    );
    std::fs::remove_dir_all(root).expect("cleanup");
}

#[test]
fn c12_reopens_and_replays_receipt_idempotently() {
    let vector = vector();
    let root = temporary_root("reopen");
    let mut coordinator = ConstitutionalCoordinator::bootstrap(&root, &vector).expect("bootstrap");
    coordinator
        .run_acceptance_scenario(&vector)
        .expect("run C12");
    drop(coordinator);
    let mut reopened = ConstitutionalCoordinator::open(&root).expect("open");
    let first = reopened.recover().expect("first");
    let second = reopened.recover().expect("second");
    assert_eq!(first.canonical_string(), second.canonical_string());
    std::fs::remove_dir_all(root).expect("cleanup");
}

#[test]
fn c12_native_verifier_accepts_frozen_result() {
    let vector = vector();
    verify_constitutional_result(required(&vector, "expected")).expect("verify");
}

#[test]
fn c12_crash_point_type_remains_stable() {
    assert_eq!(
        ConstitutionalCrashPoint::AfterMember(2),
        ConstitutionalCrashPoint::AfterMember(2)
    );
}
