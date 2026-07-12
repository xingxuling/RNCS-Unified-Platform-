// WorkspacePanel — 工作区下拉面板
// MVP-2 Phase 6:工作区切换 / 重命名 / 删除 / 导入导出 / 快照 / 最近打开
//
// 纪律:
//   - 仅做 UI 编排,业务逻辑全在 csl/workspace
//   - 所有文案中文
//   - 失败必有提示

import { useState, useCallback, useEffect } from 'react';
import {
  FolderOpen, Plus, Download, Upload, Save, Trash2, Camera,
  Clock, Package, AlertCircle, Lock, Copy, ShieldAlert,
} from 'lucide-react';
import {
  createWorkspace, setActiveWorkspace, getActiveWorkspace,
  renameWorkspace, removeWorkspace,
  listWorkspaces, listSnapshots, deleteSnapshot,
  loadRecent,
  buildSnapshotFromResult, recordSnapshot,
  buildCSLFileText, downloadCSLFile, pickCSLFile, parseCSLFileText,
  exportBundleZip,
  importBundleZip, pickBundleFile, importBundleAsWorkspace,
  forkAsEditable, isWorkspaceEditable,
  BundleImportError,
  StorageError,
  type Workspace, type DiagnosticSnapshot,
} from '@/csl/workspace';
import type { CSLResult } from '@/csl';
import type { GrammarVersion } from '@/csl';
import {
  Popover, PopoverTrigger, PopoverContent,
} from '@/components/ui/popover';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';

interface WorkspacePanelProps {
  /** 当前编辑的源码与版本(由 Playground 传入) */
  currentSource: string;
  currentVersion: GrammarVersion;
  currentResult: CSLResult | null;
  /** 切换/导入工作区时,Playground 用此回调更新自己的 state */
  onLoadWorkspace: (w: Workspace) => void;
  /** 工作区被新建后 Playground 立即同步当前编辑内容到该工作区 */
  activeWorkspaceId: string | null;
}

export function WorkspacePanel({
  currentSource, currentVersion, currentResult,
  onLoadWorkspace, activeWorkspaceId,
}: WorkspacePanelProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [snapshots, setSnapshots] = useState<DiagnosticSnapshot[]>([]);
  const [recent, setRecent] = useState(loadRecent());
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [snapshotOpen, setSnapshotOpen] = useState(false);
  const [viewSnapshot, setViewSnapshot] = useState<DiagnosticSnapshot | null>(null);

  const refresh = useCallback(() => {
    setWorkspaces(listWorkspaces());
    setRecent(loadRecent());
    if (activeWorkspaceId) setSnapshots(listSnapshots(activeWorkspaceId));
    else setSnapshots([]);
  }, [activeWorkspaceId]);

  useEffect(() => { refresh(); }, [refresh]);

  const active = workspaces.find(w => w.id === activeWorkspaceId) ?? null;

  // ---------- 操作 ----------

  const handleCreate = () => {
    try {
      const w = createWorkspace({
        name: createName || '未命名工作区',
        cslVersion: currentVersion,
        source: '',
      });
      setActiveWorkspace(w.id);
      onLoadWorkspace(w);
      setCreateOpen(false);
      setCreateName('');
      toast({ title: '已创建工作区', description: w.name });
      refresh();
    } catch (e) {
      toast({ title: '创建失败', description: String(e), variant: 'destructive' });
    }
  };

  const handleSwitch = (id: string) => {
    const w = setActiveWorkspace(id);
    if (w) {
      onLoadWorkspace(w);
      toast({ title: '已切换工作区', description: w.name });
      refresh();
    }
  };

  const handleRename = () => {
    if (!active) return;
    renameWorkspace(active.id, renameValue);
    setRenameOpen(false);
    refresh();
    toast({ title: '已重命名' });
  };

  const handleDelete = () => {
    if (!active) return;
    if (!confirm(`确认删除工作区「${active.name}」?该操作不可撤销,关联快照将一并删除。`)) return;
    removeWorkspace(active.id);
    const next = getActiveWorkspace();
    if (next) onLoadWorkspace(next);
    refresh();
    toast({ title: '已删除工作区' });
  };

  const handleExportCSL = () => {
    if (!active) return;
    const text = buildCSLFileText({
      source: currentSource,
      cslVersion: currentVersion,
      workspaceName: active.name,
    });
    downloadCSLFile(`${active.name}.csl`, text);
    toast({ title: '已导出 .csl' });
  };

  const handleImportCSL = async () => {
    const file = await pickCSLFile();
    if (!file) return;
    const parsed = parseCSLFileText(file.text);
    try {
      const w = createWorkspace({
        name: parsed.header.workspaceName || file.filename.replace(/\.csl$/i, ''),
        cslVersion: parsed.header.cslVersion ?? currentVersion,
        source: parsed.source,
        origin: {
          kind: 'imported_csl',
          sourceLabel: file.filename,
          importedAt: new Date().toISOString(),
        },
      });
      setActiveWorkspace(w.id);
      onLoadWorkspace(w);
      refresh();
      toast({ title: '已导入 .csl', description: `新建工作区:${w.name}` });
    } catch (e) {
      toast({
        title: '导入失败',
        description: e instanceof StorageError ? e.message : String(e),
        variant: 'destructive',
      });
    }
  };

  const handleImportBundle = async () => {
    const file = await pickBundleFile();
    if (!file) return;
    try {
      const parsed = await importBundleZip(file);
      const w = importBundleAsWorkspace(parsed, file.name);
      setActiveWorkspace(w.id);
      onLoadWorkspace(w);
      refresh();
      toast({
        title: parsed.verdict === 'compatible' ? '已导入运行包' : '已导入(只读)',
        description: parsed.compat.primaryHint,
      });
    } catch (e) {
      if (e instanceof BundleImportError) {
        toast({
          title: '运行包导入失败',
          description: e.message + (e.details.length ? '\n' + e.details.join('\n') : ''),
          variant: 'destructive',
        });
      } else {
        toast({ title: '运行包导入失败', description: String(e), variant: 'destructive' });
      }
    }
  };

  const handleForkActive = () => {
    if (!active) return;
    const forked = forkAsEditable(active.id);
    if (forked) {
      setActiveWorkspace(forked.id);
      onLoadWorkspace(forked);
      refresh();
      toast({ title: '已另存为可编辑工作区', description: forked.name });
    }
  };

  const handleManualSnapshot = () => {
    if (!active || !currentResult) {
      toast({ title: '无法记录快照', description: '请先运行一次', variant: 'destructive' });
      return;
    }
    const snap = buildSnapshotFromResult(active.id, currentSource, currentVersion, currentResult, 'manual');
    recordSnapshot(snap);
    refresh();
    toast({ title: '已记录快照', description: `IR ${snap.summary.irNodeCount} 节点` });
  };

  const handleExportBundle = async () => {
    if (!active || !currentResult) {
      toast({ title: '无法导出', description: '请先运行一次', variant: 'destructive' });
      return;
    }
    try {
      // 用最新源码覆盖 workspace 字段,确保 bundle 与编辑器一致
      const wsForExport: Workspace = { ...active, source: currentSource, cslVersion: currentVersion };
      await exportBundleZip(wsForExport, currentResult);
      toast({ title: '已导出 .cslbundle.zip' });
    } catch (e) {
      toast({ title: '导出失败', description: String(e), variant: 'destructive' });
    }
  };

  const handleDeleteSnapshot = (id: string) => {
    deleteSnapshot(id);
    refresh();
  };

  // ---------- 渲染 ----------

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm hover:bg-muted"
            title="工作区"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span className="max-w-[160px] truncate">
              {active?.name ?? '未保存'}
            </span>
            {active && <Badge variant="outline" className="text-[10px] font-mono">{active.cslVersion}</Badge>}
            {active && active.lockState === 'read_only' && (
              <Lock className="w-3 h-3 text-status-warning" aria-label="只读" />
            )}
            {active && active.lockState === 'incompatible' && (
              <ShieldAlert className="w-3 h-3 text-destructive" aria-label="不兼容" />
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[440px] p-0">
          {/* 当前工作区 */}
          <div className="p-3 border-b">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground">当前工作区</span>
              {active && (
                <div className="flex gap-1">
                  <button
                    className="text-[10px] text-muted-foreground hover:text-foreground"
                    onClick={() => { setRenameValue(active.name); setRenameOpen(true); }}
                  >重命名</button>
                  <span className="text-muted-foreground">·</span>
                  <button
                    className="text-[10px] text-destructive hover:underline"
                    onClick={handleDelete}
                  >删除</button>
                </div>
              )}
            </div>
            {active ? (
              <div className="text-sm">
                <div className="font-medium truncate flex items-center gap-1.5">
                  {active.name}
                  {active.lockState === 'read_only' && (
                    <Badge variant="outline" className="text-[9px] border-status-warning/40 text-status-warning">只读</Badge>
                  )}
                  {active.lockState === 'incompatible' && (
                    <Badge variant="outline" className="text-[9px] border-destructive/40 text-destructive">不兼容</Badge>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {active.cslVersion} · {active.source.length} 字符 · 更新于 {new Date(active.updatedAt).toLocaleString('zh-CN')}
                </div>
                {/* P2:版本身份 + 来源 */}
                {active.lastBuildStamps && (
                  <div className="text-[10px] font-mono text-muted-foreground mt-1">
                    grammar={active.lastBuildStamps.grammarVersion} · spec={active.lastBuildStamps.specVersion} · compiler={active.lastBuildStamps.compilerVersion} · ose={active.lastBuildStamps.osePolicyVersion}
                  </div>
                )}
                {active.origin && active.origin.kind !== 'local' && (
                  <div className="text-[10px] text-muted-foreground mt-1">
                    来源:{active.origin.kind === 'imported_bundle' ? '运行包' : '.csl 文件'}
                    {active.origin.sourceLabel && ` · ${active.origin.sourceLabel}`}
                  </div>
                )}
                {active.origin?.primaryHint && (
                  <div className="text-[11px] text-status-warning mt-1 flex items-start gap-1">
                    <ShieldAlert className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>{active.origin.primaryHint}</span>
                  </div>
                )}
                {active.origin?.compatReasons && active.origin.compatReasons.length > 0 && (
                  <ul className="text-[10px] text-muted-foreground mt-1 space-y-0.5">
                    {active.origin.compatReasons.slice(0, 3).map((r, i) => <li key={i}>· {r}</li>)}
                  </ul>
                )}
                {active.lockState === 'read_only' && (
                  <button
                    onClick={handleForkActive}
                    className="mt-2 flex items-center gap-1 px-2 py-1 rounded border text-[11px] hover:bg-muted"
                  >
                    <Copy className="w-3 h-3" />另存为可编辑工作区
                  </button>
                )}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">
                未选择工作区,当前编辑内容不会持久化
              </div>
            )}
          </div>

          {/* 操作栏 */}
          <div className="grid grid-cols-2 gap-1 p-2 border-b">
            <button
              className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs hover:bg-muted"
              onClick={() => { setCreateName(''); setCreateOpen(true); }}
            >
              <Plus className="w-3 h-3" />新建
            </button>
            <button
              className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs hover:bg-muted"
              onClick={handleImportCSL}
            >
              <Upload className="w-3 h-3" />导入 .csl
            </button>
            <button
              className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs hover:bg-muted"
              onClick={handleImportBundle}
            >
              <Package className="w-3 h-3" />导入运行包
            </button>
            <button
              className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs hover:bg-muted disabled:opacity-50"
              disabled={!active}
              onClick={handleExportCSL}
            >
              <Download className="w-3 h-3" />导出 .csl
            </button>
            <button
              className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs hover:bg-muted disabled:opacity-50 col-span-2"
              disabled={!active || !currentResult || !isWorkspaceEditable(active)}
              onClick={handleExportBundle}
              title={active && !isWorkspaceEditable(active) ? '只读工作区不得导出当前版本运行包,请先「另存为可编辑」' : ''}
            >
              <Package className="w-3 h-3" />导出运行包
            </button>
            <button
              className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs hover:bg-muted disabled:opacity-50 col-span-2"
              disabled={!active || !currentResult}
              onClick={handleManualSnapshot}
            >
              <Camera className="w-3 h-3" />记录诊断快照
            </button>
          </div>

          {/* 工作区列表 */}
          <div className="border-b">
            <div className="px-3 pt-2 text-[11px] font-semibold text-muted-foreground">所有工作区({workspaces.length})</div>
            <ScrollArea className="max-h-[140px]">
              <div className="p-1">
                {workspaces.length === 0 && (
                  <div className="px-2 py-3 text-xs text-muted-foreground text-center">暂无工作区</div>
                )}
                {workspaces.map(w => (
                  <button
                    key={w.id}
                    onClick={() => handleSwitch(w.id)}
                    className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded text-left text-xs hover:bg-muted ${w.id === activeWorkspaceId ? 'bg-primary/10' : ''}`}
                  >
                    <span className="truncate flex-1">{w.name}</span>
                    <Badge variant="outline" className="text-[9px] font-mono">{w.cslVersion}</Badge>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* 最近打开 */}
          {recent.length > 0 && (
            <div className="border-b">
              <div className="px-3 pt-2 text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />最近打开
              </div>
              <div className="p-1">
                {recent.slice(0, 5).map(r => (
                  <button
                    key={r.workspaceId}
                    onClick={() => handleSwitch(r.workspaceId)}
                    className="w-full flex items-center justify-between gap-2 px-2 py-1 rounded text-left text-[11px] hover:bg-muted text-muted-foreground"
                  >
                    <span className="truncate flex-1">{r.name}</span>
                    <span className="text-[10px]">{new Date(r.lastOpenedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 快照 */}
          <div>
            <div className="px-3 pt-2 pb-1 text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
              <span>诊断快照({snapshots.length})</span>
              {snapshots.length > 0 && (
                <button
                  className="text-[10px] text-primary hover:underline"
                  onClick={() => setSnapshotOpen(true)}
                >查看全部</button>
              )}
            </div>
            <ScrollArea className="max-h-[120px]">
              <div className="p-1">
                {snapshots.length === 0 && (
                  <div className="px-2 py-2 text-[11px] text-muted-foreground text-center">暂无快照</div>
                )}
                {snapshots.slice().reverse().slice(0, 5).map(s => (
                  <button
                    key={s.id}
                    onClick={() => setViewSnapshot(s)}
                    className="w-full flex items-center gap-2 px-2 py-1 rounded text-left text-[11px] hover:bg-muted"
                  >
                    {s.summary.oseBlocked
                      ? <AlertCircle className="w-3 h-3 text-destructive flex-shrink-0" />
                      : <Save className="w-3 h-3 text-status-success flex-shrink-0" />}
                    <span className="flex-1 truncate">
                      IR {s.summary.irNodeCount} · {s.summary.blockCount} 阻断 · {s.summary.warnCount} 警告
                    </span>
                    <Badge variant="outline" className="text-[9px]">{s.trigger === 'auto' ? '自动' : '手动'}</Badge>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </PopoverContent>
      </Popover>

      {/* 新建对话框 */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建工作区</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              placeholder="工作区名称"
              value={createName}
              onChange={e => setCreateName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
              autoFocus
            />
            <p className="text-[11px] text-muted-foreground">
              将以当前 CSL 版本({currentVersion})创建,源码为空。
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleCreate}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 重命名 */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重命名工作区</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleRename(); }}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>取消</Button>
            <Button onClick={handleRename}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 快照详情 / 全部 */}
      <Dialog open={!!viewSnapshot || snapshotOpen} onOpenChange={(v) => { if (!v) { setViewSnapshot(null); setSnapshotOpen(false); }}}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewSnapshot ? '快照详情' : '所有快照'}</DialogTitle>
          </DialogHeader>
          {viewSnapshot ? (
            <div className="space-y-2 text-sm">
              <div className="text-xs text-muted-foreground">
                {new Date(viewSnapshot.takenAt).toLocaleString('zh-CN')} · {viewSnapshot.cslVersion} · {viewSnapshot.trigger === 'auto' ? '自动' : '手动'}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>解析: {viewSnapshot.summary.parseOk ? '✓' : '✗'}</div>
                <div>IR 节点: {viewSnapshot.summary.irNodeCount}</div>
                <div>阻断: {viewSnapshot.summary.blockCount}</div>
                <div>警告: {viewSnapshot.summary.warnCount}</div>
              </div>
              {viewSnapshot.topMessages.length > 0 && (
                <div>
                  <div className="text-xs font-semibold mb-1">关键诊断</div>
                  <ul className="space-y-1 text-xs font-mono bg-muted/50 rounded p-2">
                    {viewSnapshot.topMessages.map((m, i) => <li key={i}>· {m}</li>)}
                  </ul>
                </div>
              )}
              <div className="pt-2 flex justify-end">
                <Button variant="destructive" size="sm" onClick={() => { handleDeleteSnapshot(viewSnapshot.id); setViewSnapshot(null); }}>
                  <Trash2 className="w-3 h-3 mr-1" />删除此快照
                </Button>
              </div>
            </div>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-1">
                {snapshots.slice().reverse().map(s => (
                  <div key={s.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted text-xs">
                    {s.summary.oseBlocked
                      ? <AlertCircle className="w-3 h-3 text-destructive" />
                      : <Save className="w-3 h-3 text-status-success" />}
                    <div className="flex-1">
                      <div>{new Date(s.takenAt).toLocaleString('zh-CN')}</div>
                      <div className="text-muted-foreground">IR {s.summary.irNodeCount} · 阻断 {s.summary.blockCount} · 警告 {s.summary.warnCount}</div>
                    </div>
                    <Badge variant="outline" className="text-[9px]">{s.trigger === 'auto' ? '自动' : '手动'}</Badge>
                    <button className="text-destructive" onClick={() => handleDeleteSnapshot(s.id)}>
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
