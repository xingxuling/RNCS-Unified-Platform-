use rfe_canonical::parse_json;
use rfe_constitutional_reality::ConstitutionalCoordinator;
use std::time::{Instant, SystemTime, UNIX_EPOCH};

fn main() {
    let vector = parse_json(include_str!(
        "../../../conformance/vectors/c12-constitutional-reality.json"
    ))
    .expect("C12 vector");
    let iterations = 200_u128;
    let start = Instant::now();
    for index in 0..iterations {
        let nonce = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("clock")
            .as_nanos();
        let root = std::env::temp_dir().join(format!("rfe-bench-c12-{nonce}-{index}"));
        let mut coordinator = ConstitutionalCoordinator::bootstrap(&root, &vector).expect("bootstrap");
        coordinator
            .run_acceptance_scenario(&vector)
            .expect("run C12");
        std::fs::remove_dir_all(root).expect("cleanup");
    }
    let elapsed = start.elapsed();
    println!(
        "{{\"format\":\"rfe.benchmark.constitutional-reality.native.v1.0\",\"iterations\":{iterations},\"meanNanoseconds\":{}}}",
        elapsed.as_nanos() / iterations
    );
}
