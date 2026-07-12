import { CURRENCY_SAFETY_FOOTER } from "@/constants/currency/currencySafetyRules";

export function CurrencySafetyNote() {
  return (
    <div className="border border-amber-500/30 rounded-md p-3 bg-amber-950/10 text-[12px] leading-relaxed text-amber-100/80">
      <span className="font-semibold text-amber-300">非现实货币声明 · </span>
      {CURRENCY_SAFETY_FOOTER}
    </div>
  );
}
