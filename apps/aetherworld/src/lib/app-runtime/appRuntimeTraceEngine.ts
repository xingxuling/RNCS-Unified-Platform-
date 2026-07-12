export interface AppRuntimeTraceEntry {
  step: string;
  description: string;
  at: string;
}

export class AppRuntimeTrace {
  entries: AppRuntimeTraceEntry[] = [];
  add(step: string, description: string): void {
    this.entries.push({ step, description, at: new Date().toISOString() });
  }
  toArray(): AppRuntimeTraceEntry[] { return [...this.entries]; }
}

export function createTrace(): AppRuntimeTrace { return new AppRuntimeTrace(); }
