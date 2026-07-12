use rfe_canonical::parse_json;
use rfe_constitutional_reality::ConstitutionalCoordinator;
use std::time::{SystemTime, UNIX_EPOCH};

fn main() {
    let vector = parse_json(include_str!(
        "../../../conformance/vectors/c12-constitutional-reality.json"
    ))
    .expect("C12 vector");
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("clock")
        .as_nanos();
    let root = std::env::temp_dir().join(format!("rfe-dump-c12-{nonce}"));
    let mut coordinator = ConstitutionalCoordinator::bootstrap(&root, &vector).expect("bootstrap");
    let result = coordinator
        .run_acceptance_scenario(&vector)
        .expect("run C12");
    println!("{}", result.canonical_string());
    std::fs::remove_dir_all(root).expect("cleanup");
}
