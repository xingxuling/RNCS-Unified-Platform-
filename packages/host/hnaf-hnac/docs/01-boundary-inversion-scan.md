# Naming Boundary Inversion Scan v0.1

The scan begins with the conventional module name, identifies the hidden boundary it assumes, then reverses the subject/object relationship.

| Conventional boundary | Hidden assumption | Inverted object | Resulting module |
|---|---|---|---|
| Cross-platform app | The app must adapt to each OS | The OS hosts one neutral app object | **HNAC — Host-Neutral Application Capsule** |
| Runtime | Runtime owns the app | Host translates declared semantics | **HTR — Host Translation Runtime** |
| Native API wrapper | OS API is the canonical language | Capability intent is canonical; OS API is a dialect | **HCP — Host Capability Protocol** |
| Permission list | Permission is static possession | Access is a scoped, revocable lease | **CAL — Capability Authorization Ledger** |
| Responsive UI | Geometry adapts to screen width | Interaction meaning is projected to a context | **AIP — Adaptive Interface Projection** |
| Device detection | Device category determines behavior | Available resources and interaction modes determine projection | **RCG — Resource Context Graph** |
| Installer | Package mutates a machine | Host materializes a reversible local projection | **DME — Deployment Materialization Engine** |
| Platform build | Source is rebuilt separately for every OS | One application object is projected into required shells | **DPC — Distribution Projection Compiler** |
| App bundle ID | Store identity defines the app | App identity exists above stores | **AID — Application Identity Domain** |
| Plugin system | Core grants plugins internal access | Components compose only through contracts | **ACE — Application Composition Engine** |
| Dependency manager | Packages are named mutable versions | Components are content-addressed verified objects | **CAG — Content Address Graph** |
| Settings folder | State belongs to a host filesystem path | State belongs to a schema and app identity | **PSL — Portable State Layer** |
| Sync engine | Cloud is the state authority | Replicas reconcile under explicit ownership rules | **SRP — State Reconciliation Protocol** |
| Auto updater | New files replace old files | Signed state transitions advance an application graph | **TUG — Trust and Update Graph** |
| Code signing | Signature merely approves a binary | Identity, provenance, policy, and contents form a trust graph | **TGI — Trust Graph Infrastructure** |
| Sandbox | Host blocks dangerous actions | Components start with zero authority and request contracts | **ZAC — Zero-Authority Component model** |
| Compatibility layer | Old behavior is emulated ad hoc | Capabilities are negotiated into an execution plan | **CNP — Capability Negotiation Planner** |
| Fallback code | Failure branches live inside app logic | Degradation is an explicit policy graph | **DGP — Degradation Graph Planner** |
| Window lifecycle | OS callbacks define app life | Semantic lifecycle events are mapped by hosts | **SLB — Semantic Lifecycle Bus** |
| Input handling | Mouse/touch/controller are primary concepts | User intent and action semantics are primary | **IAS — Interaction Action Semantics** |
| Accessibility adapter | Accessibility is added after UI | Semantics are native to the interface graph | **USG — Universal Semantics Graph** |
| Hardware acceleration | App binds to GPU/vendor API | Workloads declare computational intent and constraints | **EFP — Execution Fabric Planner** |
| Background service | Platform daemon model is assumed | Work declares duration, urgency, energy, and connectivity needs | **WSC — Work Scheduling Contract** |
| Network API | Transport/protocol is embedded in logic | Service contracts are transport-neutral | **TSC — Transport-Neutral Service Contract** |
| Logging | Each platform emits unrelated logs | One semantic trace spans hosts and projections | **HOT — Host-Neutral Observability Trace** |
| App store metadata | Store fields are hand-authored | Store listings are projections of canonical metadata | **MPC — Marketplace Projection Compiler** |
| Compliance checklist | Jurisdiction is external paperwork | Policy constraints participate in build/projection planning | **PPE — Policy Projection Engine** |
| Test matrix | Teams manually enumerate devices | A capability-context space generates conformance cases | **CCL — Compatibility and Conformance Lab** |
| SDK | Toolchain follows one language/runtime | Contracts generate bindings for many languages | **CFC — Contract Forge Compiler** |
| App registry | Registry owns package truth | Registries mirror signed content-addressed objects | **AFR — Application Fabric Registry** |

## Structural finding

The central inversion is larger than “one package for many operating systems”:

> Operating systems stop being application definitions and become capability-bearing hosts.

The format therefore cannot be designed alone. It requires a fabric containing object identity, execution contracts, host translation, interface projection, state portability, trust, updates, distribution projections, conformance, and tooling.
