import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { applyBranchChanges, createRealityBranch, diffRealityBranch } from '../src/branch-engine.mjs';

function tempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

test('structured patches match LF provider text against CRLF files and preserve CRLF', () => {
  const sourcePath = tempDir('dml-branch-source-');
  const branchesRoot = tempDir('dml-branch-candidates-');
  fs.writeFileSync(path.join(sourcePath, 'exact.txt'), 'alpha\r\nbeta\r\n', 'utf8');
  fs.writeFileSync(path.join(sourcePath, 'regex.txt'), 'interface Alpha {\r\n  value:string;\r\n}\r\ninterface Beta {}\r\n', 'utf8');
  const branch = createRealityBranch({ sourcePath, branchesRoot, projectId: 'project:test', label: 'CRLF patch' });

  applyBranchChanges(branch, [
    { type: 'replace', path: 'exact.txt', search: 'alpha\nbeta\n', replace: 'one\ntwo\n', expectedOccurrences: 1 },
    { type: 'regex-replace', path: 'regex.txt', pattern: 'interface Alpha \\{[\\s\\S]*?\\n\\}\\ninterface Beta', replace: 'interface Alpha {\n  value:number;\n}\ninterface Beta', expectedOccurrences: 1 },
  ]);

  assert.equal(fs.readFileSync(path.join(branch.branch_path, 'exact.txt'), 'utf8'), 'one\r\ntwo\r\n');
  assert.equal(fs.readFileSync(path.join(branch.branch_path, 'regex.txt'), 'utf8'), 'interface Alpha {\r\n  value:number;\r\n}\r\ninterface Beta {}\r\n');
});

test('candidate diffs do not report intentionally excluded dist files as deletions', () => {
  const sourcePath = tempDir('dml-branch-source-');
  const branchesRoot = tempDir('dml-branch-candidates-');
  fs.mkdirSync(path.join(sourcePath, 'src'), { recursive: true });
  fs.mkdirSync(path.join(sourcePath, 'dist'), { recursive: true });
  fs.writeFileSync(path.join(sourcePath, 'src', 'index.ts'), 'export const value = 1;\n', 'utf8');
  fs.writeFileSync(path.join(sourcePath, 'dist', 'index.js'), 'export const value = 1;\n', 'utf8');
  const branch = createRealityBranch({ sourcePath, branchesRoot, projectId: 'project:test', label: 'Source-only patch', copyDist: false });

  applyBranchChanges(branch, [
    { type: 'replace', path: 'src/index.ts', search: 'value = 1', replace: 'value = 2', expectedOccurrences: 1 },
  ]);

  assert.deepEqual(diffRealityBranch(branch).changes.map((change) => change.path), ['src/index.ts']);
});
