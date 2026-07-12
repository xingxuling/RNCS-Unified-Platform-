export const CODE_RUN_COMMAND_ALLOWLIST: string[] = [
  "npm run build",
  "npm run lint",
  "npm run typecheck",
  "npm test",
  "pnpm build",
  "pnpm test",
  "yarn build",
  "yarn test",
  "python -m pytest",
  "python -m unittest",
];

export function isAllowedCommand(cmd?: string): boolean {
  if (!cmd) return true;
  const trimmed = cmd.trim().toLowerCase();
  return CODE_RUN_COMMAND_ALLOWLIST.some((c) => trimmed.startsWith(c.toLowerCase()));
}
