// CSL 全栈投影 — .cslapp Loader
// .cslapp 本质就是一份用 v0.8 子集表达的 .csl 文件
// 内含「概念 应用」+「实例 X 属于 应用」声明
// Phase 2.0 增量:支持「概念 视图」+「实例 V_xxx 属于 视图」声明,解析为 ViewDecl[]

import type { IRContainer } from '../types';
import type { CapabilityProfile, ViewMode } from '../capability/profile';
import type { AppManifest, ProjectionDiagnostic, ViewDecl } from './types';

const APP_CONCEPT_NAME = '应用';
const VIEW_CONCEPT_NAME = '视图';

const str = (v: unknown, fallback = ''): string =>
  typeof v === 'string' ? v : v == null ? fallback : String(v);

export interface LoadAppResult {
  manifest: AppManifest | null;
  diagnostics: ProjectionDiagnostic[];
}

/** 从 IR 抽出 ViewDecl[](.cslapp 未声明视图时返回空数组)
 *  P1: enabledModes 真源 = 显式 profile.enabledModes;若未传 profile,回退 ir._meta.enabledModes(老调用方兼容)
 */
function loadViews(
  ir: IRContainer,
  diagnostics: ProjectionDiagnostic[],
  profile: CapabilityProfile | null,
): ViewDecl[] {
  const viewConcept = ir.concepts.find(c => c.name === VIEW_CONCEPT_NAME);
  if (!viewConcept) return [];
  const viewEntities = ir.entities.filter(e => e.concept_id === viewConcept.id);
  if (viewEntities.length === 0) return [];

  const views: ViewDecl[] = viewEntities.map((e): ViewDecl | null => {
    const v = e.values;
    const id = str(v['编号'], e.name);
    const title = str(v['标题'], id);
    const path = str(v['路径'], '/' + id.toLowerCase());
    const primaryConcept = str(v['主概念']);
    const endpoint = str(v['端点'], `/api/${id.toLowerCase()}`);
    const methodRaw = str(v['方法'], 'POST').toUpperCase();
    const method: 'POST' | 'GET' = methodRaw === 'GET' ? 'GET' : 'POST';
    const modeRaw = str(v['模式'], method === 'GET' ? 'summary' : 'form').toLowerCase();
    let mode: 'form' | 'summary' | 'stage' | 'blocks' | 'mapping' = 'form';
    if (modeRaw === 'summary') mode = 'summary';
    else if (modeRaw === 'stage' || modeRaw === '状态机') mode = 'stage';
    else if (modeRaw === 'blocks' || modeRaw === '概念块网络') mode = 'blocks';
    else if (modeRaw === 'mapping' || modeRaw === '跨域映射') mode = 'mapping';
    const subjectRef = str(v['绑定主体']) || str(v['主体']) || undefined;
    const rootBlock = str(v['根块']) || str(v['rootBlock']) || str(v['块根']) || undefined;

    // P1 / H4: 显式 profile 优先,ir._meta 兜底;两者皆缺时不裁决(向后兼容老调用方)
    const enabledModes: readonly ViewMode[] | readonly string[] | undefined =
      profile?.enabledModes ?? ir._meta?.enabledModes;
    const modeSource = profile ? 'profile.enabledModes' : (ir._meta ? 'ir._meta.enabledModes' : null);
    if (enabledModes && !(enabledModes as readonly string[]).includes(mode)) {
      diagnostics.push({
        level: 'error',
        message: `[Projection/H4] 视图「${id}」模式「${mode}」未在 ${modeSource} 中启用 (whyModeUnavailable: 该模式所依赖的 feature 未启用),视图被丢弃`,
      });
      return null;
    }

    const needsPrimaryConcept = mode === 'form' || mode === 'summary' || mode === 'stage';
    if (needsPrimaryConcept && !primaryConcept) {
      diagnostics.push({
        level: 'warn',
        message: `视图「${id}」未声明主概念,该视图将无法正确投影字段`,
      });
    }
    if (mode === 'blocks' && !rootBlock) {
      diagnostics.push({
        level: 'warn',
        message: `blocks 视图「${id}」未声明「根块」字段,将默认取 concept_blocks 中的第一个块`,
      });
    }
    if (mode === 'stage' && !subjectRef) {
      diagnostics.push({
        level: 'warn',
        message: `视图「${id}」声明为 stage 模式但未绑定「主体」字段,无法显示当前阶段`,
      });
    }
    return { id, title, path, primaryConcept, endpoint, method, mode, subjectRef, rootBlock };
  }).filter((v): v is ViewDecl => v !== null);

  diagnostics.push({
    level: 'info',
    message: `已解析 ${views.length} 个视图: ${views.map(v => `${v.id}(${v.path})`).join(', ')}`,
  });
  return views;
}

/**
 * 从一份已经解析好的 IR 中抽出 AppManifest
 * 约定：必须存在「概念 应用」且至少有一个实例
 */
export function loadAppManifest(ir: IRContainer, profile?: CapabilityProfile): LoadAppResult {
  const diagnostics: ProjectionDiagnostic[] = [];

  const appConcept = ir.concepts.find(c => c.name === APP_CONCEPT_NAME);
  if (!appConcept) {
    diagnostics.push({
      level: 'error',
      message: `未找到「概念 ${APP_CONCEPT_NAME}」声明,无法构造 AppManifest`,
    });
    return { manifest: null, diagnostics };
  }

  const appEntities = ir.entities.filter(e => e.concept_id === appConcept.id);
  if (appEntities.length === 0) {
    diagnostics.push({
      level: 'error',
      message: `已有「概念 ${APP_CONCEPT_NAME}」但无任何实例,无法构造 AppManifest`,
    });
    return { manifest: null, diagnostics };
  }

  if (appEntities.length > 1) {
    diagnostics.push({
      level: 'warn',
      message: `检测到 ${appEntities.length} 个应用实例,本轮仅取第一个: ${appEntities[0].name}`,
    });
  }

  const e = appEntities[0];
  const v = e.values;

  const views = loadViews(ir, diagnostics, profile ?? null);
  const modules = str(v['模块'])
    .split(',').map(s => s.trim()).filter(Boolean);

  const manifest: AppManifest = {
    name: str(v['名称'], e.name),
    version: str(v['版本'], '0.1'),
    entryView: str(v['入口视图'], views[0]?.id || '主页'),
    target: 'web',
    frontendFramework: 'react-ts',
    backendFramework: 'node-ts',
    includedSpecs: str(v['包含规格'])
      .split(',')
      .map(s => s.trim())
      .filter(Boolean),
    modules: modules.length ? modules : undefined,
    views: views.length ? views : undefined,
  };

  // 软校验：目标环境
  const target = str(v['目标环境']);
  if (target && target !== 'web') {
    diagnostics.push({
      level: 'warn',
      message: `目标环境 "${target}" 当前不支持,Phase 1 仅支持 "web",已强制使用 web`,
    });
  }

  // 软校验:入口视图必须在 views 中
  if (views.length > 0 && !views.find(vw => vw.id === manifest.entryView || vw.title === manifest.entryView)) {
    diagnostics.push({
      level: 'warn',
      message: `入口视图 "${manifest.entryView}" 不在已声明视图中(${views.map(v => v.id).join(', ')}),将回退为第一个视图 "${views[0].id}"`,
    });
    manifest.entryView = views[0].id;
  }

  diagnostics.push({
    level: 'info',
    message: `已加载应用本体: ${manifest.name} v${manifest.version}` +
      (views.length ? ` · ${views.length} 视图` : ' · 单视图回退'),
  });

  return { manifest, diagnostics };
}
