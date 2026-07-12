import { parseReality } from './parser.mjs';
import { checkReality } from './type-system.mjs';
import { RCLCompileError } from './errors.mjs';
import { realityRoot } from './canonical.mjs';
import { REALITY_DOMAINS, CROSS_DOMAIN_AXES, COMPOSITE_REALITY_PLANES, META_REALITY_PLANES } from './foundation.mjs';

export const RCL_LANGUAGE_VERSION = '0.12.0-alpha.1';

function lower(program, symbols) {
  const facets = [];
  const warrants = [];
  const reckons = [];
  const hosts = [];
  const rules = [];
  const directives = [];
  const metaDomains = [];
  const physicals = [];
  const perceptions = [];
  const neurals = [];
  const livings = [];
  const genetics = [];
  const quantitatives = [];
  const knowledges = [];
  const naturalLanguages = [];
  const understandings = [];
  const creations = [];
  const spacetimes = [];
  const accelerations = [];
  const compressions = [];
  const energies = [];
  const elements = [];
  const sciences = [];
  const embodiments = [];
  const spirits = [];

  const pushFacet = facet => facets.push(facet);

  for (const node of program.body) {
    if (node.kind === 'FacetDecl') pushFacet(node);
    else if (node.kind === 'SubjectDecl') {
      node.facets.forEach(pushFacet);
      warrants.push(...node.warrants);
    } else if (node.kind === 'ReckonDecl') reckons.push(node);
    else if (node.kind === 'HostDecl') hosts.push(node);
    else if (node.kind === 'MetaDecl') {
      node.facets.forEach(pushFacet);
      metaDomains.push(node);
    } else if (node.kind === 'PhysicalDecl') {
      node.facets.forEach(pushFacet);
      node.bodies.forEach(body => body.facets.forEach(pushFacet));
      node.fields.forEach(field => field.facets.forEach(pushFacet));
      physicals.push(node);
    } else if (node.kind === 'PerceptionDecl') {
      node.channels.forEach(channel => pushFacet({
        kind: 'FacetDecl', path: channel.path, valueType: channel.valueType,
        value: channel.expression, owner: node.name, derivedBy: 'perception',
      }));
      perceptions.push(node);
    } else if (node.kind === 'NeuralDecl') {
      node.facets.forEach(pushFacet);
      neurals.push(node);
    } else if (node.kind === 'LivingDecl') {
      node.facets.forEach(pushFacet);
      node.senses.forEach(sense => pushFacet({
        kind: 'FacetDecl', path: sense.path, valueType: sense.valueType,
        value: { kind: 'PathExpr', path: sense.source }, owner: node.name,
        derivedBy: 'sense',
      }));
      livings.push(node);
    } else if (node.kind === 'GeneticDecl') {
      node.facets.forEach(pushFacet);
      node.genes.forEach(gene => pushFacet({ ...gene, owner: node.name, genetic: true }));
      genetics.push(node);
    } else if (node.kind === 'QuantitativeDecl') {
      node.measures.forEach(measure => pushFacet({
        kind: 'FacetDecl', path: measure.path,
        valueType: `Measure<${measure.baseType}>`,
        value: measure.value, owner: node.name, measure,
      }));
      node.derives.forEach(derive => pushFacet({
        kind: 'FacetDecl', path: derive.path, valueType: derive.valueType,
        value: derive.expression, owner: node.name, derivedBy: 'quantitative',
      }));
      quantitatives.push(node);
    } else if (node.kind === 'KnowledgeDecl') {
      node.claims.forEach(claim => pushFacet({
        kind: 'FacetDecl', path: claim.path, valueType: `Know<${claim.baseType}>`,
        value: null, owner: node.name, knowledge: claim, deferred: true,
      }));
      node.derives.forEach(derive => pushFacet({
        kind: 'FacetDecl', path: derive.path, valueType: `Know<${derive.baseType}>`,
        value: null, owner: node.name, knowledge: derive, deferred: true,
      }));
      knowledges.push(node);
    } else if (node.kind === 'NaturalLanguageDecl') {
      node.utterances.forEach(utterance => pushFacet({
        kind: 'FacetDecl', path: utterance.path, valueType: 'Utterance',
        value: null, owner: node.name, naturalLanguage: utterance, deferred: true,
      }));
      node.intents.forEach(intent => pushFacet({
        kind: 'FacetDecl', path: intent.path, valueType: 'Intent',
        value: null, owner: node.name, naturalLanguage: intent, deferred: true,
      }));
      naturalLanguages.push(node);
    } else if (node.kind === 'UnderstandingDecl') {
      node.hypotheses.forEach(item => pushFacet({
        kind: 'FacetDecl', path: item.path, valueType: `Understand<${item.baseType}>`,
        value: null, owner: node.name, understanding: item, deferred: true,
      }));
      understandings.push(node);
    } else if (node.kind === 'CreationDecl') {
      node.candidates.forEach(candidate => pushFacet({
        kind: 'FacetDecl', path: candidate.path, valueType: `Create<${candidate.baseType}>`,
        value: null, owner: node.name, creation: candidate, deferred: true,
      }));
      if (node.selection) {
        const selected = node.candidates.find(candidate => node.selection.candidates.includes(candidate.path));
        pushFacet({
          kind: 'FacetDecl', path: node.selection.path,
          valueType: selected ? `Create<${selected.baseType}>` : 'Unknown',
          value: null, owner: node.name, selection: node.selection, deferred: true,
        });
      }
      creations.push(node);
    } else if (node.kind === 'EnergyDecl') {
      node.reservoirs.forEach(item => pushFacet({ kind: 'FacetDecl', path: item.path, valueType: item.valueType, value: item.value, owner: node.name, energyReservoir: item }));
      energies.push(node);
    } else if (node.kind === 'ElementDecl') {
      [...node.species, ...node.compounds].forEach(item => pushFacet({ kind: 'FacetDecl', path: item.path, valueType: 'Element', value: null, owner: node.name, elementEntity: item, deferred: true }));
      elements.push(node);
    } else if (node.kind === 'ScienceDecl') {
      node.hypotheses.forEach(item => pushFacet({ kind: 'FacetDecl', path: item.path, valueType: `Science<${item.baseType}>`, value: null, owner: node.name, science: item, deferred: true }));
      node.experiments.forEach(item => pushFacet({ kind: 'FacetDecl', path: item.path, valueType: 'Experiment', value: null, owner: node.name, experiment: item, deferred: true }));
      node.conclusions.forEach(item => pushFacet({ kind: 'FacetDecl', path: item.path, valueType: 'Science<Truth>', value: null, owner: node.name, scienceConclusion: item, deferred: true }));
      sciences.push(node);
    } else if (node.kind === 'EmbodimentDecl') {
      node.facets.forEach(pushFacet);
      node.systems.forEach(part => part.facets.forEach(pushFacet));
      node.organs.forEach(part => part.facets.forEach(pushFacet));
      pushFacet({ kind: 'FacetDecl', path: `${node.name}.state`, valueType: 'BodyState', value: null, owner: node.name, deferred: true });
      embodiments.push(node);
    } else if (node.kind === 'SpiritDecl') {
      node.facets.forEach(pushFacet);
      [...node.values, ...node.purposes, ...node.affects].forEach(item => pushFacet({ kind: 'FacetDecl', path: item.path, valueType: item.valueType, value: item.expression, owner: node.name, spiritAspect: item }));
      pushFacet({ kind: 'FacetDecl', path: `${node.name}.state`, valueType: 'SpiritState', value: null, owner: node.name, deferred: true });
      spirits.push(node);
    } else if (node.kind === 'SpacetimeDecl') {
      node.clocks.forEach(clock => pushFacet({
        kind: 'FacetDecl', path: clock.path, valueType: clock.valueType,
        value: clock.value, owner: node.name, spacetimeClock: clock,
      }));
      node.coordinates.forEach(coordinate => pushFacet({
        kind: 'FacetDecl', path: coordinate.path, valueType: 'SpacetimePoint',
        value: coordinate.expression, owner: node.name, spacetimeCoordinate: coordinate,
      }));
      spacetimes.push(node);
    } else if (node.kind === 'AccelerationDecl') accelerations.push(node);
    else if (node.kind === 'CompressionDecl') compressions.push(node);
    else if (node.kind === 'Emergence' || node.kind === 'Resonance') rules.push(node);
    else if (['Foresee', 'Realize', 'Reflect', 'Advance', 'Observe', 'Propagate', 'Live', 'Inherit', 'Quantify', 'Learn', 'Interpret', 'Understand', 'Create', 'Synchronize', 'Accelerate', 'Compress', 'Restore', 'Energize', 'Constitute', 'Investigate', 'Embody', 'Integrate'].includes(node.kind)) directives.push(node);
  }

  const ir = {
    format: 'rcl.reality-program.v0.10',
    languageVersion: RCL_LANGUAGE_VERSION,
    foundation: {
      format: 'rcl.reality-foundation.v0.6',
      domains: REALITY_DOMAINS,
      crossDomainAxes: CROSS_DOMAIN_AXES,
      compositePlanes: COMPOSITE_REALITY_PLANES,
      metaRealityPlanes: META_REALITY_PLANES,
    },
    name: program.name,
    facets,
    facetTypes: Object.fromEntries(symbols.facets.entries()),
    subjects: [...symbols.subjects.keys()],
    warrants,
    reckons,
    hosts,
    metaDomains,
    physicals,
    perceptions,
    neurals,
    livings,
    genetics,
    quantitatives,
    knowledges,
    naturalLanguages,
    understandings,
    creations,
    spacetimes,
    accelerations,
    compressions,
    energies,
    elements,
    sciences,
    embodiments,
    spirits,
    rules,
    directives,
  };
  return Object.freeze({ ...ir, programRoot: realityRoot(ir) });
}

export function tryCompileReality(source) {
  try {
    const ast = parseReality(source);
    const checked = checkReality(ast);
    if (checked.diagnostics.length > 0) return { ok: false, diagnostics: checked.diagnostics, ast, program: null };
    return { ok: true, diagnostics: [], ast, program: lower(ast, checked.symbols) };
  } catch (error) {
    const diagnostic = {
      code: error.code ?? 'RCL_PARSE_FAILURE',
      message: error.message,
      details: error.details ?? {},
    };
    return { ok: false, diagnostics: [diagnostic], ast: null, program: null };
  }
}

export function compileReality(source) {
  const result = tryCompileReality(source);
  if (!result.ok) throw new RCLCompileError(result.diagnostics);
  return result.program;
}
