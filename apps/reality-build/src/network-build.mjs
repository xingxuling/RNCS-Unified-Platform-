import { BuildError } from './canonical.mjs';
import { compileNetworkWorld, verifyNetworkWorldCompilation } from '@taowind/reality-studio-native';

export function compileNetworkBuild(project) {
  if (!project?.network) return null;
  try {
    const compilation = compileNetworkWorld(project);
    const verification = verifyNetworkWorldCompilation(compilation);
    if (!verification.valid) {
      throw new BuildError('NETWORK_COMPILATION_INVALID', '', verification);
    }
    return compilation;
  } catch (error) {
    if (error instanceof BuildError) throw error;
    throw new BuildError('NETWORK_COMPILATION_FAILED', error?.message ?? String(error), {
      cause_code: error?.code ?? error?.name ?? 'UNKNOWN',
    });
  }
}

export function verifyNetworkBuild(compilation) {
  const verification = verifyNetworkWorldCompilation(compilation);
  return {
    ...verification,
    valid: verification.valid === true,
    compilation_root: compilation?.compilation_root ?? null,
  };
}
