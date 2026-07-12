import { dirname } from 'node:path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { cryptographicHash, deepClone, type VSRContext, type VSRDocument, type VSREvent, type VSRValue } from '../../spec/src/index.js';
import { sealInteractionAuthorization, type VSRInteractionAuthorization, type VSRInteractionCommitReceipt, type VSRInteractionProposal } from '../../interaction-runtime/src/index.js';

export interface RFEProjectionOmission { category:string; reason:string }
export interface RFEVisualDeviceProfile { width?:number;height?:number;dpr?:number;locale?:string;inputModes?:string[] }
export interface RFEVisualSemantic {
  id:string;kind:'entity'|'relation'|'affordance'|'warning'|'label'|'environment';concept:string;importance?:number;
  position?:{x:number;y:number;z?:number};bounds?:{width:number;height:number;depth?:number};state?:Record<string,VSRValue>;styleHint?:string;provisional?:boolean;
}
export interface RFEObserverProjection {
  realityVersion:string;logicalTime:number;observerId:string;visualSemantics:RFEVisualSemantic[];deviceProfile?:RFEVisualDeviceProfile;
  omittedInformation?:RFEProjectionOmission[];provisional?:boolean;
}
export interface RFEAdapterOptions { variablePrefix?:string;timeScale?:number;strict?:boolean }
export interface VSRRuntimeInput {
  variables:Record<string,VSRValue>;events:VSREvent[];contextOverrides?:Partial<VSRContext>;projectionMetadata:{realityVersion:string;observerId:string;logicalTime:number;provisional:boolean};
}
export interface RFEVisualInteractionEvent { type:string;nodeId?:string;payload?:Record<string,VSRValue>;time:number }
export interface RFESubjectIntent { observerId:string;realityVersion:string;intentType:string;payload:Record<string,VSRValue>;createdAtLogicalTime:number;provisional:true }

export interface RFEConstitutionalAuthorityContext {
  rfeVersion: '1.0.0';
  epoch: number;
  configurationHash: string;
  federationRoot: string;
  parentCertificateHash: string;
  authorityClusterId: string;
}

export interface RFESharedRealityBinding {
  sessionId: string;
  sequence: number;
  eventRoot: string;
  sharedStateHash: string;
}

export interface RFEVSRCommitRequest {
  format: 'rfe.vsr-authority-commit-request.v1.0';
  bridgeRuntime: 'vsr@0.1.0-alpha.12';
  requestId: string;
  subjectIntent: RFESubjectIntent;
  proposalHash: string;
  authorizationHash: string;
  interactionCommitHash: string;
  constitutional: RFEConstitutionalAuthorityContext;
  sharedReality: RFESharedRealityBinding;
  evidence: {
    sourceDisplayHash: string;
    observerDisplayHash?: string;
    deviceDisplayHash?: string;
    realityInvariantHash?: string;
    eventChainRoot?: string;
    authorityEvidenceRoot?: string;
  };
  requestHash: string;
}

export interface RFEVSRJournalReceipt {
  format: 'rfe.vsr-authority-journal-receipt.v1.0';
  status: 'persisted';
  requestHash: string;
  journalId: string;
  sequence: number;
  previousRecordHash: string;
  constitutionBindingHash: string;
  sharedRealityBindingHash: string;
  recordHash: string;
}

export interface RFEVSRJournalRecord {
  format: 'rfe.vsr-authority-journal-record.v1.0';
  request: RFEVSRCommitRequest;
  receipt: RFEVSRJournalReceipt;
}

export interface RFEVSRJournalFile {
  format: 'rfe.vsr-authority-journal.v1.0';
  journalId: string;
  records: RFEVSRJournalRecord[];
  headHash: string;
  journalHash: string;
}

export function projectionToVSR(projection:RFEObserverProjection,template:VSRDocument,options:RFEAdapterOptions={}):VSRRuntimeInput {
  const prefix=options.variablePrefix??'rfe';const semantics=projection.visualSemantics.map(s=>({id:s.id,kind:s.kind,concept:s.concept,importance:s.importance??0.5,position:s.position??null,bounds:s.bounds??null,state:s.state??{},styleHint:s.styleHint??'',provisional:Boolean(projection.provisional||s.provisional)})) as unknown as VSRValue;
  const variables:Record<string,VSRValue>={...deepClone(template.variables??{}),[prefix]:{realityVersion:projection.realityVersion,observerId:projection.observerId,logicalTime:projection.logicalTime,provisional:Boolean(projection.provisional),semantics}};
  const events:VSREvent[]=[];for(const semantic of projection.visualSemantics){if(semantic.kind==='warning')events.push({id:`rfe-warning-${semantic.id}`,time:projection.logicalTime*(options.timeScale??1),type:'set',target:`${prefix}.lastWarning`,value:semantic.concept})}
  const d=projection.deviceProfile;const contextOverrides=d?{width:d.width,height:d.height,dpr:d.dpr,locale:d.locale}:undefined;
  return{variables,events,contextOverrides,projectionMetadata:{realityVersion:projection.realityVersion,observerId:projection.observerId,logicalTime:projection.logicalTime,provisional:Boolean(projection.provisional)}};
}

export function interactionToSubjectIntent(projection:RFEObserverProjection,event:RFEVisualInteractionEvent):RFESubjectIntent {
  return{observerId:projection.observerId,realityVersion:projection.realityVersion,intentType:event.type,payload:{nodeId:event.nodeId??'',...(event.payload??{})},createdAtLogicalTime:event.time,provisional:true};
}

export function interactionProposalToSubjectIntent(projection:RFEObserverProjection,proposal:VSRInteractionProposal):RFESubjectIntent {
  if (proposal.input.observerId && proposal.input.observerId !== projection.observerId) throw new Error(`Observer mismatch: projection ${projection.observerId}, proposal ${proposal.input.observerId}.`);
  const primaryEmission=proposal.emissions[0];
  return {
    observerId:projection.observerId,
    realityVersion:projection.realityVersion,
    intentType:primaryEmission?.event??`vsr.${proposal.input.trigger}`,
    payload:{
      proposalHash:proposal.proposalHash,
      nodeId:proposal.input.nodeId,
      deviceId:proposal.input.deviceId??'',
      matchedInteractionIds:proposal.matchedInteractionIds,
      variablePatches:proposal.variablePatches as unknown as VSRValue,
      emissions:proposal.emissions as unknown as VSRValue,
      sourceDisplayHash:proposal.evidence.sourceDisplayHash,
      observerDisplayHash:proposal.evidence.observerDisplayHash??'',
      deviceDisplayHash:proposal.evidence.deviceDisplayHash??'',
      realityInvariantHash:proposal.evidence.realityInvariantHash??'',
      eventChainRoot:proposal.evidence.eventChainRoot??'',
    },
    createdAtLogicalTime:proposal.input.logicalTime,
    provisional:true,
  };
}

function assertHash(value: string, label: string): void {
  if (!/^[a-f0-9]{64}$/i.test(value)) throw new Error(`${label} must be a 64-character hexadecimal hash.`);
}

function withoutField<T extends Record<string, unknown>>(value: T, field: string): Record<string, unknown> {
  const copy = deepClone(value) as Record<string, unknown>;
  delete copy[field];
  return copy;
}

export function interactionCommitToRFERequest(
  projection: RFEObserverProjection,
  proposal: VSRInteractionProposal,
  authorizationInput: VSRInteractionAuthorization,
  receipt: VSRInteractionCommitReceipt,
  constitutional: RFEConstitutionalAuthorityContext,
  sharedReality: RFESharedRealityBinding,
): RFEVSRCommitRequest {
  if (receipt.status !== 'committed') throw new Error('Only a committed VSR interaction can be bridged into an RFE authority request.');
  const authorization = sealInteractionAuthorization(authorizationInput);
  if (proposal.proposalHash !== receipt.proposalHash || authorization.proposalHash !== proposal.proposalHash || authorization.authorizationHash !== receipt.authorizationHash) throw new Error('VSR interaction hash bindings are inconsistent.');
  if (!Number.isInteger(constitutional.epoch) || constitutional.epoch <= 0) throw new Error('RFE constitutional epoch must be positive.');
  assertHash(constitutional.configurationHash, 'configurationHash');
  assertHash(constitutional.federationRoot, 'federationRoot');
  assertHash(constitutional.parentCertificateHash, 'parentCertificateHash');
  assertHash(sharedReality.eventRoot, 'sharedReality.eventRoot');
  assertHash(sharedReality.sharedStateHash, 'sharedReality.sharedStateHash');
  const subjectIntent = interactionProposalToSubjectIntent(projection, proposal);
  const base = {
    format: 'rfe.vsr-authority-commit-request.v1.0' as const,
    bridgeRuntime: 'vsr@0.1.0-alpha.12' as const,
    requestId: `rfe-commit:${proposal.proposalHash}`,
    subjectIntent,
    proposalHash: proposal.proposalHash,
    authorizationHash: authorization.authorizationHash!,
    interactionCommitHash: receipt.commitHash,
    constitutional: deepClone(constitutional),
    sharedReality: deepClone(sharedReality),
    evidence: {
      sourceDisplayHash: proposal.evidence.sourceDisplayHash,
      observerDisplayHash: proposal.evidence.observerDisplayHash,
      deviceDisplayHash: proposal.evidence.deviceDisplayHash,
      realityInvariantHash: proposal.evidence.realityInvariantHash,
      eventChainRoot: proposal.evidence.eventChainRoot,
      authorityEvidenceRoot: receipt.authorityEvidenceRoot,
    },
  };
  return { ...base, requestHash: cryptographicHash(base) };
}

function journalFileHashInput(file: Omit<RFEVSRJournalFile, 'journalHash'>): unknown { return file; }

export class RFEVSRConstitutionalJournal {
  readonly path: string;
  readonly journalId: string;
  private records: RFEVSRJournalRecord[] = [];

  constructor(path: string, journalId = 'rfe-vsr-authority-journal') {
    this.path = path;
    this.journalId = journalId;
    if (existsSync(path)) this.load();
  }

  private load(): void {
    const parsed = JSON.parse(readFileSync(this.path, 'utf8')) as RFEVSRJournalFile;
    if (parsed.format !== 'rfe.vsr-authority-journal.v1.0' || parsed.journalId !== this.journalId) throw new Error('RFE VSR journal identity mismatch.');
    const { journalHash, ...body } = parsed;
    if (cryptographicHash(journalFileHashInput(body)) !== journalHash) throw new Error('RFE VSR journal file hash mismatch.');
    let previous = '';
    for (let index = 0; index < parsed.records.length; index++) {
      const record = parsed.records[index]!;
      if (record.format !== 'rfe.vsr-authority-journal-record.v1.0') throw new Error(`Invalid RFE VSR journal record at ${index + 1}.`);
      if (record.receipt.sequence !== index + 1 || record.receipt.previousRecordHash !== previous || record.receipt.requestHash !== record.request.requestHash) throw new Error(`RFE VSR journal chain mismatch at ${index + 1}.`);
      if (cryptographicHash(withoutField(record.request as unknown as Record<string, unknown>, 'requestHash')) !== record.request.requestHash) throw new Error(`RFE VSR request hash mismatch at ${index + 1}.`);
      const receiptInput = withoutField(record.receipt as unknown as Record<string, unknown>, 'recordHash');
      if (cryptographicHash({ request: record.request, receipt: receiptInput }) !== record.receipt.recordHash) throw new Error(`RFE VSR record hash mismatch at ${index + 1}.`);
      previous = record.receipt.recordHash;
    }
    if ((parsed.records.at(-1)?.receipt.recordHash ?? '') !== parsed.headHash) throw new Error('RFE VSR journal head mismatch.');
    this.records = deepClone(parsed.records);
  }

  private file(): RFEVSRJournalFile {
    const body: Omit<RFEVSRJournalFile, 'journalHash'> = {
      format: 'rfe.vsr-authority-journal.v1.0',
      journalId: this.journalId,
      records: deepClone(this.records),
      headHash: this.records.at(-1)?.receipt.recordHash ?? '',
    };
    return { ...body, journalHash: cryptographicHash(journalFileHashInput(body)) };
  }

  append(request: RFEVSRCommitRequest): RFEVSRJournalReceipt {
    if (cryptographicHash(withoutField(request as unknown as Record<string, unknown>, 'requestHash')) !== request.requestHash) throw new Error('RFE VSR commit request hash mismatch.');
    const duplicate = this.records.find(record => record.request.requestHash === request.requestHash);
    if (duplicate) return deepClone(duplicate.receipt);
    const previousRecordHash = this.records.at(-1)?.receipt.recordHash ?? '';
    const receiptBase = {
      format: 'rfe.vsr-authority-journal-receipt.v1.0' as const,
      status: 'persisted' as const,
      requestHash: request.requestHash,
      journalId: this.journalId,
      sequence: this.records.length + 1,
      previousRecordHash,
      constitutionBindingHash: cryptographicHash(request.constitutional),
      sharedRealityBindingHash: cryptographicHash(request.sharedReality),
    };
    const recordHash = cryptographicHash({ request, receipt: receiptBase });
    const receipt: RFEVSRJournalReceipt = { ...receiptBase, recordHash };
    this.records.push({ format: 'rfe.vsr-authority-journal-record.v1.0', request: deepClone(request), receipt });
    mkdirSync(dirname(this.path), { recursive: true });
    writeFileSync(this.path, JSON.stringify(this.file(), null, 2));
    return deepClone(receipt);
  }

  verify(): { ok: boolean; records: number; headHash: string; journalHash: string; error?: string } {
    try {
      const file = this.file();
      const verifier = new RFEVSRConstitutionalJournal(this.path, this.journalId);
      return { ok: verifier.records.length === this.records.length, records: this.records.length, headHash: file.headHash, journalHash: file.journalHash };
    } catch (error) {
      return { ok: false, records: this.records.length, headHash: this.records.at(-1)?.receipt.recordHash ?? '', journalHash: '', error: error instanceof Error ? error.message : String(error) };
    }
  }

  entries(): RFEVSRJournalRecord[] { return deepClone(this.records); }
}
