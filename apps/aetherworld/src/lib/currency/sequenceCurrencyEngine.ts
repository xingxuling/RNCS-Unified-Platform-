import { calculateReward, type RewardInput, type RewardResult, type SubjectMode } from "./rewardCalculationEngine";
import { appendRewardToLedger, computeBalance, getLedger, getTodaySummary, clearLedger, type LedgerEntry, type BalanceSummary } from "./creditLedgerEngine";
import { valuateAsset, type AssetValueInput, type AssetValueResult } from "./assetValuationEngine";
import { grantResource, getResourceBalance, suggestResourcesForSequence, type ResourceBalance } from "./worldResourceEngine";
import { runCurrencyAudit, type CurrencyAuditResult } from "./currencyAuditEngine";
import { runCurrencySafety } from "./currencySafetyGuard";

export interface RecordContributionInput extends RewardInput {
  description: string;
  sourceEngine: string;
  sourceId?: string;
  /** 若提供数列，自动赠送对应世界资源（每个数字 +1）。 */
  msl?: string;
}

export interface RecordContributionResult {
  reward: RewardResult;
  ledgerEntries: LedgerEntry[];
  grantedResources: { id: string; amount: number }[];
  balance: BalanceSummary;
}

export function recordContribution(input: RecordContributionInput): RecordContributionResult {
  const reward = calculateReward(input);
  const ledgerEntries = appendRewardToLedger(reward, {
    sourceEngine: input.sourceEngine,
    sourceId: input.sourceId,
    description: input.description,
    safetyNotes: reward.riskNotes,
  });

  const grantedResources: { id: string; amount: number }[] = [];
  if (input.msl && reward.subjectMode !== "DEMO") {
    const ids = suggestResourcesForSequence(input.msl);
    for (const id of ids) {
      grantResource(reward.subjectMode, id, 1);
      grantedResources.push({ id, amount: 1 });
    }
  }

  return {
    reward,
    ledgerEntries,
    grantedResources,
    balance: computeBalance(reward.subjectMode),
  };
}

export interface CurrencyOverview {
  subjectMode: SubjectMode;
  balance: BalanceSummary;
  resources: ResourceBalance;
  today: ReturnType<typeof getTodaySummary>;
  recentEntries: LedgerEntry[];
}

export function getCurrencyOverview(mode: SubjectMode): CurrencyOverview {
  return {
    subjectMode: mode,
    balance: computeBalance(mode),
    resources: getResourceBalance(mode),
    today: getTodaySummary(mode),
    recentEntries: getLedger(mode).slice(-20).reverse(),
  };
}

export function valueAsset(input: AssetValueInput): AssetValueResult {
  return valuateAsset(input);
}

export function runAudit(mode: SubjectMode, extraText?: string): CurrencyAuditResult {
  return runCurrencyAudit(mode, extraText);
}

export function clearCurrencyLedger(mode: SubjectMode): void {
  clearLedger(mode);
}

export function inspectText(text: string) {
  return runCurrencySafety(text);
}
