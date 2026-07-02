# Requirements Architecture

The v0.1 acceptance contract is executable rather than interface-only. It requires authoritative server ticks, eight versioned protocol objects, prediction, acknowledgement, rollback and replay, visual-only interpolation, deterministic fault injection, AAF-compatible authorization, RFE-compatible evidence, RBF recovery candidates, Gateway invocation and a two-player Loopback example.

The automated suite contains 20 named scenarios covering convergence, 20 percent loss, reordering, duplicate input, cross-player denial, expired authority, late join, reconnect, wrong prediction, visual isolation, recovery branches, deterministic replay, Gateway discovery, direct state-write denial, tick-window denial, burst loss, session closure and single authority ownership.

Out of scope for v0.1: public matchmaking, production encryption, QUIC or UDP deployment, cross-region migration and commercial MMO scale.