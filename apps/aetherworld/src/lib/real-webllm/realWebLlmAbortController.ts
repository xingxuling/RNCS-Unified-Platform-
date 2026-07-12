// Real WebLLM 取消控制
let currentAbort: AbortController | null = null;
let stopFlag = false;

export function beginAbortable(): AbortController {
  if (currentAbort) currentAbort.abort();
  currentAbort = new AbortController();
  stopFlag = false;
  return currentAbort;
}

export function requestStop() {
  stopFlag = true;
  if (currentAbort) currentAbort.abort();
}

export function shouldStop() {
  return stopFlag;
}

export function clearAbort() {
  currentAbort = null;
  stopFlag = false;
}
