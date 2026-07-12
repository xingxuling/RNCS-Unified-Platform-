import { listSkills, seedDefaultSkills } from "./skillRegistry";
import { listSoulProfiles, seedDefaultSoulProfiles } from "./soulProfileRegistry";
import {
  listAgentBlueprints,
  runBlueprintPreflight,
  seedDefaultAgentBlueprints,
  type BlueprintPreflightReport,
} from "./agentBlueprintRegistry";

export interface AgentAssetBootstrapResult {
  initializedAt: string;
  counts: {
    skills: number;
    soulProfiles: number;
    blueprints: number;
  };
  preflight: {
    total: number;
    pass: number;
    warn: number;
    block: number;
    reports: BlueprintPreflightReport[];
  };
  notes: string[];
}

export function bootstrapAgentAssets(): AgentAssetBootstrapResult {
  seedDefaultSkills();
  seedDefaultSoulProfiles();
  seedDefaultAgentBlueprints();

  const skills = listSkills();
  const soulProfiles = listSoulProfiles();
  const blueprints = listAgentBlueprints();
  const reports = blueprints.map((blueprint) => runBlueprintPreflight(blueprint));

  const pass = reports.filter((report) => report.decision === "PASS").length;
  const warn = reports.filter((report) => report.decision === "WARN").length;
  const block = reports.filter((report) => report.decision === "BLOCK").length;

  const notes: string[] = [];
  if (skills.length === 0) notes.push("No skills found after bootstrap.");
  if (soulProfiles.length === 0) notes.push("No soul profiles found after bootstrap.");
  if (blueprints.length === 0) notes.push("No agent blueprints found after bootstrap.");
  if (block > 0) notes.push(`${block} blueprint(s) are blocked by preflight.`);
  if (warn > 0) notes.push(`${warn} blueprint(s) need review warnings.`);
  if (pass > 0) notes.push(`${pass} blueprint(s) passed preflight.`);

  return {
    initializedAt: new Date().toISOString(),
    counts: {
      skills: skills.length,
      soulProfiles: soulProfiles.length,
      blueprints: blueprints.length,
    },
    preflight: {
      total: reports.length,
      pass,
      warn,
      block,
      reports,
    },
    notes,
  };
}

export function getAgentAssetSnapshot(): AgentAssetBootstrapResult {
  const skills = listSkills();
  const soulProfiles = listSoulProfiles();
  const blueprints = listAgentBlueprints();
  const reports = blueprints.map((blueprint) => runBlueprintPreflight(blueprint));

  const pass = reports.filter((report) => report.decision === "PASS").length;
  const warn = reports.filter((report) => report.decision === "WARN").length;
  const block = reports.filter((report) => report.decision === "BLOCK").length;

  return {
    initializedAt: new Date().toISOString(),
    counts: {
      skills: skills.length,
      soulProfiles: soulProfiles.length,
      blueprints: blueprints.length,
    },
    preflight: {
      total: reports.length,
      pass,
      warn,
      block,
      reports,
    },
    notes: ["Snapshot only. No default assets were seeded."],
  };
}
