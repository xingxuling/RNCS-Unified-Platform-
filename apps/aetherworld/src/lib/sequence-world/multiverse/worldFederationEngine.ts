import type { CrossWorldRelation, RegisteredWorld, WorldFederationState } from "./types";
import { shortId } from "./types";
import type { WorldFederationTypeId } from "@/constants/sequence-world/multiverse/worldFederationTypes";

export interface FederationInput {
  worlds: RegisteredWorld[];
  relations: CrossWorldRelation[];
  federationType?: WorldFederationTypeId;
  name?: string;
  founderOnly?: boolean;
}

export function formFederation(input: FederationInput): WorldFederationState | null {
  const stable = input.relations.filter((r) => r.trust >= 0.6 && r.conflict <= 0.4);
  if (stable.length < 1) return null;
  const memberSet = new Set<string>();
  stable.forEach((r) => {
    memberSet.add(r.worldA);
    memberSet.add(r.worldB);
  });
  const members = [...memberSet];
  return {
    federationId: shortId("fed"),
    name: input.name ?? "默认世界联邦",
    memberWorldIds: members,
    federationType: input.federationType ?? "CREATOR_FEDERATION",
    sharedRules: ["遵守跨世界正典边界", "虚拟世界结构，不代表现实"],
    sharedResources: [],
    governanceModel: input.founderOnly ? "FOUNDER_DECREE" : "COUNCIL",
    stability: 0.6,
    conflictRisk: 0.3,
    founderLocked: !!input.founderOnly,
  };
}
