import { renderPng } from '../../backend-canvas/src/index.js';
import { evaluateAt, prepareDocument, type VSRPreparedDocument } from '../../core/src/index.js';
import { createDeviceProfile, projectDisplayForDevice, verifyDeviceProjectionSet, type VSRDeviceClass, type VSRDeviceProjection } from '../../device-projection/src/index.js';
import { projectDisplayForObserver, verifyObserverProjectionSet, type VSRObserverProfile, type VSRObserverProjection } from '../../observer-projection/src/index.js';
import { cryptographicHash, documentHash, type VSRDocument, type VSRNode } from '../../spec/src/index.js';
import type { VSRSimulationBranchResult, VSRSimulationBranchSet } from '../../simulation-branch/src/index.js';

export interface VSRSimulationBranchVisualOptions {
  width?: number;
  height?: number;
  title?: string;
  maxBranches?: number;
}

export interface VSRSimulationBranchView {
  observer: VSRObserverProfile;
  observerProjection: VSRObserverProjection;
  devices: VSRDeviceProjection[];
  deviceVerification: ReturnType<typeof verifyDeviceProjectionSet>;
  pngByDevice: Record<string, Uint8Array>;
  pngHashByDevice: Record<string, string>;
}

export interface VSRSimulationBranchRenderSet {
  setRoot: string;
  sourceDocumentHash: string;
  sourceDisplayHash: string;
  observerVerification: ReturnType<typeof verifyObserverProjectionSet>;
  views: VSRSimulationBranchView[];
}

const evidencePolicy = {
  format: 'vsr.observer-policy.v0.1',
  anyRole: ['planner', 'auditor'],
  deny: 'redact',
  reason: 'simulation-branch-evidence',
};

const internalPolicy = {
  format: 'vsr.observer-policy.v0.1',
  anyRole: ['planner'],
  deny: 'hide',
  reason: 'simulation-branch-internal',
};

export function createSimulationBranchObserverProfile(kind: 'viewer' | 'planner' | 'auditor'): VSRObserverProfile {
  return {
    format: 'vsr.observer-profile.v0.1',
    observerId: `simulation-branch:${kind}`,
    roles: [kind],
    scopes: kind === 'viewer' ? ['simulation.branch.view'] : ['simulation.branch.view', 'simulation.branch.evidence'],
    clearance: kind === 'viewer' ? 0 : kind === 'auditor' ? 2 : 3,
  };
}

function branchColor(index: number): string {
  return ['#2563eb', '#7c3aed', '#059669', '#ea580c'][index % 4]!;
}

function safeNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function bodyNodes(branch: VSRSimulationBranchResult, cardX: number, cardY: number, cardWidth: number, cardHeight: number, index: number): VSRNode[] {
  const bodies = branch.finalSnapshot.bodies;
  const minX = Math.min(...bodies.map(body => body.position.x - body.halfSize.x));
  const maxX = Math.max(...bodies.map(body => body.position.x + body.halfSize.x));
  const minY = Math.min(...bodies.map(body => body.position.y - body.halfSize.y));
  const maxY = Math.max(...bodies.map(body => body.position.y + body.halfSize.y));
  const worldWidth = Math.max(1, maxX - minX);
  const worldHeight = Math.max(1, maxY - minY);
  const sceneX = cardX + 18;
  const sceneY = cardY + 104;
  const sceneWidth = cardWidth - 36;
  const sceneHeight = Math.max(120, cardHeight - 218);
  const scale = Math.min(sceneWidth / worldWidth, sceneHeight / worldHeight) * 0.92;
  return bodies.map(body => ({
    id: `branch:${branch.branchId}:body:${body.id}`,
    type: 'rect' as const,
    zIndex: 20,
    layout: {
      x: sceneX + (body.position.x - body.halfSize.x - minX) * scale,
      y: sceneY + (body.position.y - body.halfSize.y - minY) * scale,
      width: Math.max(4, body.halfSize.x * 2 * scale),
      height: Math.max(4, body.halfSize.y * 2 * scale),
    },
    appearance: {
      fill: { type: 'solid' as const, color: body.kind === 'static' ? '#334155' : branchColor(index) },
      stroke: { type: 'solid' as const, color: '#e2e8f0' },
      strokeWidth: 1,
      opacity: body.awake ? 1 : 0.72,
    },
    content: { cornerRadius: body.kind === 'static' ? 2 : 5 },
    tags: ['simulation-branch-body', body.kind],
    data: { branchId: branch.branchId, bodyId: body.id, stateRoot: branch.finalSnapshot.stateRoot },
  }));
}

export function createSimulationBranchDocument(set: VSRSimulationBranchSet, options: VSRSimulationBranchVisualOptions = {}): VSRDocument {
  const width = options.width ?? 1280;
  const height = options.height ?? 720;
  const maxBranches = Math.max(1, Math.min(4, options.maxBranches ?? 4));
  const branches = set.branches.slice(0, maxBranches);
  const gap = 18;
  const margin = 26;
  const cardWidth = (width - margin * 2 - gap * Math.max(0, branches.length - 1)) / Math.max(1, branches.length);
  const cardY = 92;
  const cardHeight = height - 132;
  const nodes: VSRNode[] = [
    {
      id: 'simulation-branch:title', type: 'text', zIndex: 100,
      layout: { x: margin, y: 22, width: width - margin * 2, height: 34 },
      appearance: { fill: { type: 'solid', color: '#f8fafc' } },
      content: { text: options.title ?? '现实模拟分支比较', fontSize: 26 },
    },
    {
      id: 'simulation-branch:root', type: 'text', zIndex: 100,
      layout: { x: margin, y: 58, width: width - margin * 2, height: 20 },
      appearance: { fill: { type: 'solid', color: '#94a3b8' } },
      content: { text: `base ${set.baseSimulationRoot.slice(0, 18)}… · branches ${set.branchCount} · set ${set.setRoot.slice(0, 18)}…`, fontSize: 12 },
      extensions: { 'vsr:observer-policy': evidencePolicy },
    },
  ];
  branches.forEach((branch, index) => {
    const x = margin + index * (cardWidth + gap);
    nodes.push(
      {
        id: `branch:${branch.branchId}:card`, type: 'rect', zIndex: 5,
        layout: { x, y: cardY, width: cardWidth, height: cardHeight },
        appearance: { fill: { type: 'solid', color: '#111827' }, stroke: { type: 'solid', color: branchColor(index) }, strokeWidth: 2 },
        content: { cornerRadius: 14 },
      },
      {
        id: `branch:${branch.branchId}:label`, type: 'text', zIndex: 30,
        layout: { x: x + 18, y: cardY + 16, width: cardWidth - 36, height: 26 },
        appearance: { fill: { type: 'solid', color: '#f8fafc' } },
        content: { text: branch.label, fontSize: 18 },
      },
      {
        id: `branch:${branch.branchId}:summary`, type: 'text', zIndex: 30,
        layout: { x: x + 18, y: cardY + 46, width: cardWidth - 36, height: 48 },
        appearance: { fill: { type: 'solid', color: '#cbd5e1' } },
        content: { text: `tick ${branch.baseTick}→${branch.finalTick} · risk ${branch.metrics.riskScore}\nchanged ${branch.metrics.changedBodyCount} · contacts ${branch.metrics.finalContactCount}`, fontSize: 12 },
      },
      {
        id: `branch:${branch.branchId}:evidence`, type: 'text', zIndex: 30,
        layout: { x: x + 18, y: cardY + cardHeight - 92, width: cardWidth - 36, height: 54 },
        appearance: { fill: { type: 'solid', color: '#94a3b8' } },
        content: { text: `branch ${branch.branchRoot.slice(0, 18)}…\ndelta ${branch.causalDelta.deltaRoot.slice(0, 18)}…`, fontSize: 10 },
        extensions: { 'vsr:observer-policy': evidencePolicy },
      },
      {
        id: `branch:${branch.branchId}:internal`, type: 'text', zIndex: 30,
        layout: { x: x + 18, y: cardY + cardHeight - 34, width: cardWidth - 36, height: 18 },
        appearance: { fill: { type: 'solid', color: '#64748b' } },
        content: { text: `speed ${safeNumber(branch.metrics.maxSpeed)} · displacement ${safeNumber(branch.metrics.totalDisplacement)}`, fontSize: 10 },
        extensions: { 'vsr:observer-policy': internalPolicy },
      },
      ...bodyNodes(branch, x, cardY, cardWidth, cardHeight, index),
    );
  });
  return {
    specVersion: '0.1',
    runtimeTarget: 'vsr-simulation-branch-v0.1',
    metadata: {
      id: `simulation-branches:${set.setRoot.slice(0, 16)}`,
      title: options.title ?? '现实模拟分支比较',
      duration: 86_400,
      defaultFps: 60,
      seed: 8,
      description: '同一权威现实快照的多个确定性模拟未来。',
    },
    canvas: { width, height, background: { type: 'solid', color: '#020617' } },
    variables: { branchCount: set.branchCount, setRoot: set.setRoot, baseSimulationRoot: set.baseSimulationRoot },
    nodes,
    extensions: {
      'rsr:branch-set': {
        format: set.format,
        setRoot: set.setRoot,
        branchRoots: set.branches.map(branch => branch.branchRoot),
        provisional: true,
      },
    },
  };
}


export interface VSRSimulationDensityOptions { width?:number; height?:number; maxBranches?:number }
export function createSimulationBranchDensityDocument(set:VSRSimulationBranchSet,options:VSRSimulationDensityOptions={}):VSRDocument {
  const width=options.width??1280;
  const height=options.height??720;
  const branches=set.branches.slice(0,Math.max(1,Math.min(8,options.maxBranches??8)));
  const margin=20,gap=12;
  const rowHeight=(height-margin*2-gap*Math.max(0,branches.length-1))/Math.max(1,branches.length);
  const nodes:VSRNode[]=[];
  const allBodies=branches.flatMap(branch=>branch.finalSnapshot.bodies);
  const minX=Math.min(...allBodies.map(body=>body.position.x-body.halfSize.x));
  const maxX=Math.max(...allBodies.map(body=>body.position.x+body.halfSize.x));
  const minY=Math.min(...allBodies.map(body=>body.position.y-body.halfSize.y));
  const maxY=Math.max(...allBodies.map(body=>body.position.y+body.halfSize.y));
  const worldWidth=Math.max(1,maxX-minX),worldHeight=Math.max(1,maxY-minY);
  branches.forEach((branch,index)=>{
    const y=margin+index*(rowHeight+gap);
    const risk=Math.max(0,Math.min(1,branch.metrics.riskScore/1000));
    const sceneX=margin+180,sceneWidth=width-margin*2-200;
    const scale=Math.min(sceneWidth/worldWidth,(rowHeight-12)/worldHeight)*.92;
    const color=branchColor(index);
    nodes.push(
      {id:`density:${branch.branchId}:lane`,type:'rect',layout:{x:margin,y,width:width-margin*2,height:rowHeight},appearance:{fill:{type:'solid',color:'#0f172a'}},content:{cornerRadius:8}},
      {id:`density:${branch.branchId}:risk-bg`,type:'rect',layout:{x:margin+12,y:y+12,width:140,height:Math.max(8,rowHeight-24)},appearance:{fill:{type:'solid',color:'#1e293b'}},content:{cornerRadius:4}},
      {id:`density:${branch.branchId}:risk`,type:'rect',layout:{x:margin+12,y:y+12,width:140*risk,height:Math.max(8,rowHeight-24)},appearance:{fill:{type:'solid',color:risk>.66?'#dc2626':risk>.33?'#f59e0b':'#16a34a'}},content:{cornerRadius:4}},
    );
    for(const body of branch.finalSnapshot.bodies)nodes.push({
      id:`density:${branch.branchId}:body:${body.id}`,type:'rect',
      layout:{x:sceneX+(body.position.x-body.halfSize.x-minX)*scale,y:y+6+(body.position.y-body.halfSize.y-minY)*scale,width:Math.max(2,body.halfSize.x*2*scale),height:Math.max(2,body.halfSize.y*2*scale)},
      appearance:{fill:{type:'solid',color:body.kind==='static'?'#475569':color},opacity:body.awake?1:.7},
      content:{cornerRadius:body.kind==='static'?1:3},
    });
  });
  return{
    specVersion:'0.1',runtimeTarget:'vsr-simulation-density-webgpu-v0.1',
    metadata:{id:`simulation-density:${set.setRoot.slice(0,16)}`,title:'Simulation Branch Density',duration:86400,defaultFps:60,seed:9,description:'WebGPU-compatible geometry-only projection of simulation candidate futures.'},
    canvas:{width,height,background:{type:'solid',color:'#020617'}},
    variables:{branchCount:set.branchCount,setRoot:set.setRoot},nodes,
    extensions:{'rsr:branch-density':{setRoot:set.setRoot,baseSimulationRoot:set.baseSimulationRoot,branchRoots:set.branches.map(branch=>branch.branchRoot),geometryOnly:true,provisional:true}},
  };
}

export class SimulationBranchVSRBridge {
  readonly document: VSRDocument;
  readonly prepared: VSRPreparedDocument;
  constructor(readonly set: VSRSimulationBranchSet, options: VSRSimulationBranchVisualOptions = {}) {
    this.document = createSimulationBranchDocument(set, options);
    this.prepared = prepareDocument(this.document);
  }

  evaluate() {
    return evaluateAt({ document: this.prepared, time: 0 });
  }

  render(
    observers: VSRObserverProfile[] = [createSimulationBranchObserverProfile('viewer'), createSimulationBranchObserverProfile('planner'), createSimulationBranchObserverProfile('auditor')],
    devices: VSRDeviceClass[] = ['desktop', 'mobile'],
    options: { rasterize?: boolean } = {},
  ): VSRSimulationBranchRenderSet {
    const evaluated = this.evaluate();
    const invariant = {
      format: 'vsr.simulation-branch-invariant.v0.1',
      setRoot: this.set.setRoot,
      baseSimulationRoot: this.set.baseSimulationRoot,
      branchRoots: this.set.branches.map(branch => branch.branchRoot),
    };
    const observerProjections = observers.map(observer => projectDisplayForObserver(this.document, evaluated.displayState, observer, { invariant }));
    const observerVerification = verifyObserverProjectionSet(observerProjections);
    const views = observerProjections.map(observerProjection => {
      const deviceProjections = devices.map(kind => projectDisplayForDevice(observerProjection.displayState, createDeviceProfile(kind, `simulation-branch:${observerProjection.observer.observerId}:${kind}`), { invariant }));
      const deviceVerification = verifyDeviceProjectionSet(deviceProjections);
      const pngByDevice: Record<string, Uint8Array> = {};
      const pngHashByDevice: Record<string, string> = {};
      if (options.rasterize !== false) {
        for (const device of deviceProjections) {
          const png = renderPng(device.displayState);
          pngByDevice[device.profile.deviceClass] = png;
          pngHashByDevice[device.profile.deviceClass] = cryptographicHash([...png]);
        }
      }
      return { observer: observerProjection.observer, observerProjection, devices: deviceProjections, deviceVerification, pngByDevice, pngHashByDevice };
    });
    return {
      setRoot: this.set.setRoot,
      sourceDocumentHash: documentHash(this.document),
      sourceDisplayHash: evaluated.displayState.semanticHash,
      observerVerification,
      views,
    };
  }
}
