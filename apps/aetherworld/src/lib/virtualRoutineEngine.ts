// 日常节律引擎
import { VIRTUAL_DAILY_RHYTHMS, getRhythmForHour, type VirtualDailyRhythm } from "@/constants/virtualDailyRhythms";

export function getCurrentRhythm(date: Date = new Date()): VirtualDailyRhythm {
  return getRhythmForHour(date.getHours());
}

export function listRhythms(): VirtualDailyRhythm[] {
  return VIRTUAL_DAILY_RHYTHMS;
}
