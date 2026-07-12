declare const process: {
  argv: string[];
  cwd(): string;
  exitCode?: number;
  exit(code?: number): never;
  env: Record<string, string | undefined>;
  platform: string;
  version: string;
  memoryUsage(): { heapUsed: number; rss: number };
  stdout: { write(chunk: string): void };
  stderr: { write(chunk: string): void };
};
declare const Buffer: {
  from(input: any, encodingOrOffset?: any, length?: number): any;
  alloc(size: number): any;
  concat(chunks: any[]): any;
  byteLength(input: any): number;
  isBuffer(input: unknown): boolean;
};
type Buffer = any;
declare module "node:fs" {
  export function readFileSync(path: string, encoding?: string): any;
  export function writeFileSync(path: string, data: any): void;
  export function existsSync(path: string): boolean;
  export function mkdirSync(path: string, options?: any): void;
  export function rmSync(path: string, options?: any): void;
  export function readdirSync(path: string, options?: any): any[];
  export function statSync(path: string): { isDirectory(): boolean; size: number };
  export function createReadStream(path: string): any;
  export function cpSync(source: string, destination: string, options?: any): void;
}
declare module "node:path" {
  export function resolve(...paths: string[]): string;
  export function dirname(path: string): string;
  export function join(...paths: string[]): string;
  export function extname(path: string): string;
  export function relative(from: string, to: string): string;
  export function normalize(path: string): string;
}
declare module "node:zlib" { export function deflateSync(data: any, options?: any): any; export function inflateSync(data: any, options?: any): any; }
declare module "node:http" { export function createServer(handler: (req: any, res: any) => void): { listen(port: number, cb: () => void): void; listen(port: number, host: string, cb: () => void): void; close(cb?: (error?: Error) => void): void; address(): { port: number } | string | null }; }
declare module "node:child_process" { export function spawnSync(command: string, args?: string[], options?: any): { status: number | null; stdout?: any; stderr?: any; error?: Error }; }
declare module "node:url" { export function fileURLToPath(url: string | URL): string; }
declare module "node:assert/strict" { const assert: any; export default assert; }
declare module "node:crypto" { export function createHash(algorithm: string): { update(data: any): any; digest(encoding?: string): any }; }

declare module "node:perf_hooks" { export const performance: { now(): number }; }
