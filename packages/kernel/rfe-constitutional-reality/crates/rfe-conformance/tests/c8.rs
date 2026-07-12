use rfe_canonical::{parse_json, JsonValue};
use rfe_cross_domain_atomic::AtomicRealityCoordinator;
use std::time::{SystemTime, UNIX_EPOCH};

fn required<'a>(value: &'a JsonValue, key: &str) -> &'a JsonValue {
    value.get(key).unwrap_or_else(|| panic!("missing {key}"))
}

#[test]
fn c8_cross_domain_atomic_vector_is_native_conformant() {
    let vector = parse_json(include_str!(
        "../../../conformance/vectors/c8-cross-domain-atomic.json"
    ))
    .expect("C8 vector");
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("clock")
        .as_nanos();
    let root = std::env::temp_dir().join(format!("rfe-conformance-c8-{nonce}"));
    let coordinator = AtomicRealityCoordinator::bootstrap(&root, required(&vector, "participants"))
        .expect("bootstrap C8");
    let actual = coordinator
        .run_acceptance_scenario(
            required(&vector, "abortTransaction"),
            required(&vector, "commitTransaction"),
        )
        .expect("run C8");
    assert_eq!(
        actual.canonical_string(),
        required(&vector, "expected").canonical_string()
    );
    std::fs::remove_dir_all(root).expect("cleanup C8");
}
