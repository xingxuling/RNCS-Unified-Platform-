/**
 * Lovable GitHub Sync Bridge
 *
 * 不直接操作仓库，只在 WebCodeM 的 Handoff Pack 中追加 GitHub 同步建议。
 */
export interface GithubSyncChecklist {
  branchSuggestion: string;
  commitMessageSuggestion: string;
  prTitleSuggestion: string;
  prBodySuggestion: string;
  steps: string[];
  notes: string[];
}

export interface GithubSyncInput {
  appName: string;
  changeKind?: "FEATURE" | "FIX" | "REFACTOR" | "DOCS" | "CHORE";
  summary: string;
}

const KIND_LABEL = {
  FEATURE:  { prefix: "feat",  cn: "功能" },
  FIX:      { prefix: "fix",   cn: "修复" },
  REFACTOR: { prefix: "refactor", cn: "重构" },
  DOCS:     { prefix: "docs",  cn: "文档" },
  CHORE:    { prefix: "chore", cn: "杂项" },
} as const;

export function buildGithubSyncChecklist(input: GithubSyncInput): GithubSyncChecklist {
  const kind = input.changeKind || "FEATURE";
  const k = KIND_LABEL[kind];
  const slug = input.appName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "change";
  const branch = `${k.prefix}/${slug}`;

  return {
    branchSuggestion: branch,
    commitMessageSuggestion: `${k.prefix}: ${input.summary}`,
    prTitleSuggestion: `[${k.cn}] ${input.appName} · ${input.summary}`,
    prBodySuggestion:
      `## 变更说明\n${input.summary}\n\n## 检查项\n- [ ] 本地构建通过\n- [ ] QA 已检查\n- [ ] 已更新文档 / Release Notes\n`,
    steps: [
      "在 Lovable 中通过 GitHub 同步把当前改动推送到默认分支或新分支。",
      `本地切换到分支：git checkout -b ${branch}`,
      "在 GitHub 网页或本地新建 Pull Request。",
      "Review 通过后合并到主分支。",
    ],
    notes: [
      "Lovable 与 GitHub 的双向同步是实时的，避免在 Lovable 与本地同时大改同一文件。",
      "首次连接 GitHub：聊天输入框左下角加号 → GitHub → Connect project。",
    ],
  };
}
