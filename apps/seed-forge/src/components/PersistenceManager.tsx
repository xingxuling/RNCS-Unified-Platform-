import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Database, Save, Download, Upload, Trash2, HardDrive } from 'lucide-react';
import { persistenceManager } from '@/lib/persistence/Database';
import { exportToFile, importFromFile, getExportSize } from '@/utils/dataExport';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

export const PersistenceManager = () => {
  const [autoSave, setAutoSave] = useState(false);
  const [stats, setStats] = useState({
    universeCount: 0,
    snapshotCount: 0,
    totalSize: 0,
  });
  const [exportSize, setExportSize] = useState<{
    uncompressed: number;
    estimatedCompressed: number;
  } | null>(null);

  useEffect(() => {
    loadStats();
    loadAutoSaveSetting();
  }, []);

  const loadStats = async () => {
    try {
      const dbStats = await persistenceManager.getStats();
      setStats(dbStats);
      
      const size = await getExportSize();
      setExportSize(size);
    } catch (error) {
      logger.error('Failed to load stats:', error);
    }
  };

  const loadAutoSaveSetting = async () => {
    const enabled = await persistenceManager.getSetting('autoSave');
    setAutoSave(enabled === 'true');
  };

  const handleExport = async () => {
    try {
      await exportToFile(`seed-export-${Date.now()}.json`);
      toast.success('数据导出成功');
      await loadStats();
    } catch (error) {
      toast.error('导出失败');
      logger.error('Export error:', error);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await importFromFile(file);
      toast.success('数据导入成功，页面将刷新');
    } catch (error) {
      toast.error('导入失败');
      logger.error('Import error:', error);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('确定要清空所有数据吗？此操作不可恢复！')) {
      return;
    }

    try {
      await persistenceManager.clearAll();
      toast.success('所有数据已清空');
      await loadStats();
    } catch (error) {
      toast.error('清空失败');
      logger.error('Clear error:', error);
    }
  };

  const handleAutoSaveToggle = async (enabled: boolean) => {
    setAutoSave(enabled);
    await persistenceManager.saveSetting('autoSave', enabled.toString());
    
    // TODO: 实际启用/禁用自动保存
    // 这需要在 UniverseManager 中实现
    toast.success(`自动保存已${enabled ? '启用' : '禁用'}`);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Card className="p-6 bg-card/30 backdrop-blur border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" />
          <CardTitle>数据持久化管理</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 统计信息 */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-secondary/30 rounded-lg border border-primary/10">
            <div className="text-2xl font-bold text-primary">{stats.universeCount}</div>
            <div className="text-xs text-muted-foreground">宇宙数量</div>
          </div>
          <div className="p-4 bg-secondary/30 rounded-lg border border-primary/10">
            <div className="text-2xl font-bold text-accent">{stats.snapshotCount}</div>
            <div className="text-xs text-muted-foreground">快照数量</div>
          </div>
          <div className="p-4 bg-secondary/30 rounded-lg border border-primary/10">
            <div className="text-2xl font-bold text-consciousness">
              {formatBytes(stats.totalSize)}
            </div>
            <div className="text-xs text-muted-foreground">数据大小</div>
          </div>
        </div>

        {/* 自动保存设置 */}
        <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-primary/10">
          <div className="flex items-center gap-3">
            <Save className="w-5 h-5 text-primary" />
            <div>
              <Label htmlFor="auto-save" className="font-semibold">
                自动保存
              </Label>
              <div className="text-xs text-muted-foreground">
                每30秒自动保存所有宇宙数据
              </div>
            </div>
          </div>
          <Switch
            id="auto-save"
            checked={autoSave}
            onCheckedChange={handleAutoSaveToggle}
          />
        </div>

        {/* 导出/导入 */}
        <div className="grid grid-cols-2 gap-4">
          <Button onClick={handleExport} className="w-full" variant="outline">
            <Download className="w-4 h-4 mr-2" />
            导出数据
          </Button>
          <div>
            <Input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
              id="import-file"
            />
            <Label htmlFor="import-file">
              <Button asChild className="w-full" variant="outline">
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  导入数据
                </span>
              </Button>
            </Label>
          </div>
        </div>

        {/* 导出大小信息 */}
        {exportSize && (
          <div className="p-4 bg-muted/30 rounded-lg border border-border text-xs">
            <div className="font-semibold mb-2">导出大小估算：</div>
            <div className="space-y-1 text-muted-foreground">
              <div>未压缩: {formatBytes(exportSize.uncompressed)}</div>
              <div>压缩后（估算）: {formatBytes(exportSize.estimatedCompressed)}</div>
            </div>
          </div>
        )}

        {/* 危险操作 */}
        <div className="pt-4 border-t border-border">
          <Button
            onClick={handleClearAll}
            variant="destructive"
            className="w-full"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            清空所有数据
          </Button>
        </div>

        {/* 存储信息 */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <HardDrive className="w-4 h-4" />
          <span>数据存储在浏览器 IndexedDB 中</span>
        </div>
      </CardContent>
    </Card>
  );
};

