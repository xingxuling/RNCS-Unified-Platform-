import { dirname } from 'node:path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { cryptographicHash, deepClone } from '../../spec/src/index.js';
import type { RFEConstitutionalAuthorityContext, RFESharedRealityBinding } from '../../adapter-rfe/src/index.js';
import type { VSRSimulationBranchResult, VSRSimulationBranchSelection, VSRSimulationBranchSet } from '../../simulation-branch/src/index.js';

export interface RFEVSRSimulationCommitRequest {
  format: 'rfe.vsr-simulation-commit-request.v1.0';
  bridgeRuntime: 'vsr@0.1.0-alpha.12';
  requestId: string;
  constitutional: RFEConstitutionalAuthorityContext;
  sharedReality?: RFESharedRealityBinding;
  branchSetRoot: string;
  selection: VSRSimulationBranchSelection;
  selectedBranch: {
    branchId: string;
    branchRoot: string;
    baseSimulationRoot: string;
    finalSimulationRoot: string;
    commandRoot: string;
    eventRoot: string;
    causalDeltaRoot: string;
    riskScore: number;
  };
  causalDelta: VSRSimulationBranchResult['causalDelta'];
  evidence: {
    sourceDocumentHash?: string;
    sourceDisplayHash?: string;
    observerDisplayHash?: string;
    deviceDisplayHash?: string;
    realityInvariantHash?: string;
  };
  provisional: true;
  requestHash: string;
}

export interface RFEVSRSimulationJournalReceipt {
  format: 'rfe.vsr-simulation-journal-receipt.v1.0';
  status: 'persisted';
  requestHash: string;
  journalId: string;
  sequence: number;
  previousRecordHash: string;
  constitutionBindingHash: string;
  simulationBindingHash: string;
  recordHash: string;
}

export interface RFEVSRSimulationJournalRecord {
  format: 'rfe.vsr-simulation-journal-record.v1.0';
  request: RFEVSRSimulationCommitRequest;
  receipt: RFEVSRSimulationJournalReceipt;
}

export interface RFEVSRSimulationJournalFile {
  format: 'rfe.vsr-simulation-journal.v1.0';
  journalId: string;
  records: RFEVSRSimulationJournalRecord[];
  headHash: string;
  journalHash: string;
}

function assertHash(value: string, label: string): void {
  if (!/^[a-f0-9]{64}$/i.test(value)) throw new Error(`${label} 必须是 64 位十六进制 SHA-256。`);
}

function withoutField<T extends Record<string, unknown>>(value: T, field: string): Record<string, unknown> {
  const copy = deepClone(value) as Record<string, unknown>;
  delete copy[field];
  return copy;
}

export function simulationSelectionToRFERequest(
  set: VSRSimulationBranchSet,
  selection: VSRSimulationBranchSelection,
  constitutional: RFEConstitutionalAuthorityContext,
  options: {
    sharedReality?: RFESharedRealityBinding;
    sourceDocumentHash?: string;
    sourceDisplayHash?: string;
    observerDisplayHash?: string;
    deviceDisplayHash?: string;
    realityInvariantHash?: string;
  } = {},
): RFEVSRSimulationCommitRequest {
  if (!selection.provisional) throw new Error('模拟分支选择必须保持 provisional。');
  const branch = set.branches.find(candidate => candidate.branchId === selection.selectedBranchId);
  if (!branch) throw new Error(`选择引用了不存在的模拟分支：${selection.selectedBranchId}`);
  if (branch.branchRoot !== selection.selectedBranchRoot || branch.causalDelta.deltaRoot !== selection.selectedCausalDeltaRoot) throw new Error('模拟分支选择与分支证据绑定不一致。');
  if (!Number.isInteger(constitutional.epoch) || constitutional.epoch <= 0) throw new Error('RFE constitutional epoch 必须为正整数。');
  assertHash(constitutional.configurationHash, 'configurationHash');
  assertHash(constitutional.federationRoot, 'federationRoot');
  assertHash(constitutional.parentCertificateHash, 'parentCertificateHash');
  if (options.sharedReality) {
    assertHash(options.sharedReality.eventRoot, 'sharedReality.eventRoot');
    assertHash(options.sharedReality.sharedStateHash, 'sharedReality.sharedStateHash');
  }
  const { setRoot: _setRoot, ...setBody } = set;
  if (cryptographicHash(setBody) !== set.setRoot) throw new Error('模拟分支集合根不匹配。');
  const { selectionRoot: _selectionRoot, ...selectionBody } = selection;
  if (cryptographicHash(selectionBody) !== selection.selectionRoot) throw new Error('模拟分支选择根不匹配。');
  const base = {
    format: 'rfe.vsr-simulation-commit-request.v1.0' as const,
    bridgeRuntime: 'vsr@0.1.0-alpha.12' as const,
    requestId: `rfe-simulation:${selection.selectionRoot}`,
    constitutional: deepClone(constitutional),
    ...(options.sharedReality ? { sharedReality: deepClone(options.sharedReality) } : {}),
    branchSetRoot: set.setRoot,
    selection: deepClone(selection),
    selectedBranch: {
      branchId: branch.branchId,
      branchRoot: branch.branchRoot,
      baseSimulationRoot: branch.baseSimulationRoot,
      finalSimulationRoot: branch.finalSnapshot.stateRoot,
      commandRoot: branch.commandRoot,
      eventRoot: branch.eventRoot,
      causalDeltaRoot: branch.causalDelta.deltaRoot,
      riskScore: branch.metrics.riskScore,
    },
    causalDelta: deepClone(branch.causalDelta),
    evidence: {
      sourceDocumentHash: options.sourceDocumentHash,
      sourceDisplayHash: options.sourceDisplayHash,
      observerDisplayHash: options.observerDisplayHash,
      deviceDisplayHash: options.deviceDisplayHash,
      realityInvariantHash: options.realityInvariantHash,
    },
    provisional: true as const,
  };
  return { ...base, requestHash: cryptographicHash(base) };
}

function fileHashInput(file: Omit<RFEVSRSimulationJournalFile, 'journalHash'>): unknown { return file; }

export class RFEVSRSimulationJournal {
  readonly path: string;
  readonly journalId: string;
  private records: RFEVSRSimulationJournalRecord[] = [];

  constructor(path: string, journalId = 'rfe-vsr-simulation-journal') {
    this.path = path;
    this.journalId = journalId;
    if (existsSync(path)) this.load();
  }

  private load(): void {
    const parsed = JSON.parse(readFileSync(this.path, 'utf8')) as RFEVSRSimulationJournalFile;
    if (parsed.format !== 'rfe.vsr-simulation-journal.v1.0' || parsed.journalId !== this.journalId) throw new Error('RFE VSR simulation journal identity mismatch.');
    const { journalHash, ...body } = parsed;
    if (cryptographicHash(fileHashInput(body)) !== journalHash) throw new Error('RFE VSR simulation journal file hash mismatch.');
    let previous = '';
    for (let index = 0; index < parsed.records.length; index++) {
      const record = parsed.records[index]!;
      if (record.receipt.sequence !== index + 1 || record.receipt.previousRecordHash !== previous || record.receipt.requestHash !== record.request.requestHash) throw new Error(`RFE simulation journal chain mismatch at ${index + 1}.`);
      if (cryptographicHash(withoutField(record.request as unknown as Record<string, unknown>, 'requestHash')) !== record.request.requestHash) throw new Error(`RFE simulation request hash mismatch at ${index + 1}.`);
      const receiptInput = withoutField(record.receipt as unknown as Record<string, unknown>, 'recordHash');
      if (cryptographicHash({ request: record.request, receipt: receiptInput }) !== record.receipt.recordHash) throw new Error(`RFE simulation record hash mismatch at ${index + 1}.`);
      previous = record.receipt.recordHash;
    }
    if ((parsed.records.at(-1)?.receipt.recordHash ?? '') !== parsed.headHash) throw new Error('RFE simulation journal head mismatch.');
    this.records = deepClone(parsed.records);
  }

  private file(): RFEVSRSimulationJournalFile {
    const body: Omit<RFEVSRSimulationJournalFile, 'journalHash'> = {
      format: 'rfe.vsr-simulation-journal.v1.0',
      journalId: this.journalId,
      records: deepClone(this.records),
      headHash: this.records.at(-1)?.receipt.recordHash ?? '',
    };
    return { ...body, journalHash: cryptographicHash(fileHashInput(body)) };
  }

  append(request: RFEVSRSimulationCommitRequest): RFEVSRSimulationJournalReceipt {
    if (cryptographicHash(withoutField(request as unknown as Record<string, unknown>, 'requestHash')) !== request.requestHash) throw new Error('RFE simulation commit request hash mismatch.');
    const duplicate = this.records.find(record => record.request.requestHash === request.requestHash);
    if (duplicate) return deepClone(duplicate.receipt);
    const previousRecordHash = this.records.at(-1)?.receipt.recordHash ?? '';
    const receiptBase = {
      format: 'rfe.vsr-simulation-journal-receipt.v1.0' as const,
      status: 'persisted' as const,
      requestHash: request.requestHash,
      journalId: this.journalId,
      sequence: this.records.length + 1,
      previousRecordHash,
      constitutionBindingHash: cryptographicHash(request.constitutional),
      simulationBindingHash: cryptographicHash({ branchSetRoot: request.branchSetRoot, selection: request.selection, selectedBranch: request.selectedBranch }),
    };
    const receipt: RFEVSRSimulationJournalReceipt = { ...receiptBase, recordHash: cryptographicHash({ request, receipt: receiptBase }) };
    this.records.push({ format: 'rfe.vsr-simulation-journal-record.v1.0', request: deepClone(request), receipt });
    mkdirSync(dirname(this.path), { recursive: true });
    writeFileSync(this.path, JSON.stringify(this.file(), null, 2));
    return deepClone(receipt);
  }

  verify(): { ok: boolean; records: number; headHash: string; journalHash: string; error?: string } {
    try {
      const file = this.file();
      const verifier = new RFEVSRSimulationJournal(this.path, this.journalId);
      return { ok: verifier.records.length === this.records.length, records: this.records.length, headHash: file.headHash, journalHash: file.journalHash };
    } catch (error) {
      return { ok: false, records: this.records.length, headHash: this.records.at(-1)?.receipt.recordHash ?? '', journalHash: '', error: error instanceof Error ? error.message : String(error) };
    }
  }

  entries(): RFEVSRSimulationJournalRecord[] { return deepClone(this.records); }
}
