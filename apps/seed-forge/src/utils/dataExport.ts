// THE SEED v1.5 - Data Export/Import Utilities
// 支持数据导出和导入功能

import { persistenceManager } from '@/lib/persistence/Database';
import { universeManager } from '@/lib/v1/UniverseManager';
import { logger } from './logger';

/**
 * 导出所有数据为 JSON 文件
 */
export async function exportToFile(filename: string = 'seed-export.json'): Promise<void> {
  try {
    const data = await persistenceManager.exportData();
    
    // 添加元数据
    const exportData = {
      version: '1.5',
      exportDate: new Date().toISOString(),
      ...data,
    };
    
    // 创建下载链接
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    logger.log(`Data exported to ${filename}`);
  } catch (error) {
    logger.error('Export failed:', error);
    throw error;
  }
}

/**
 * 从文件导入数据
 */
export async function importFromFile(file: File): Promise<void> {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    // 验证数据格式
    if (!data.version) {
      throw new Error('Invalid export file format');
    }
    
    // 导入数据
    await persistenceManager.importData({
      universes: data.universes,
      snapshots: data.snapshots,
      settings: data.settings,
    });
    
    logger.log('Data imported successfully');
    
    // 重新加载宇宙
    // 注意：这需要刷新页面或重新初始化
    window.location.reload();
  } catch (error) {
    logger.error('Import failed:', error);
    throw error;
  }
}

/**
 * 导出为压缩格式（使用 CompressionStream）
 */
export async function exportCompressed(filename: string = 'seed-export.json.gz'): Promise<void> {
  try {
    const data = await persistenceManager.exportData();
    const jsonString = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataStream = encoder.encode(jsonString);
    
    // 使用 CompressionStream 压缩
    const compressionStream = new CompressionStream('gzip');
    const writer = compressionStream.writable.getWriter();
    const reader = compressionStream.readable.getReader();
    
    writer.write(dataStream);
    writer.close();
    
    const chunks: Uint8Array[] = [];
    let done = false;
    
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        chunks.push(value);
      }
    }
    
    // 合并所有块
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    
    // 创建下载链接
    const blob = new Blob([result], { type: 'application/gzip' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    logger.log(`Compressed data exported to ${filename}`);
  } catch (error) {
    logger.error('Compressed export failed:', error);
    // 降级到普通导出
    await exportToFile(filename.replace('.gz', '.json'));
  }
}

/**
 * 获取导出数据大小估算
 */
export async function getExportSize(): Promise<{
  uncompressed: number;
  estimatedCompressed: number;
}> {
  const data = await persistenceManager.exportData();
  const jsonString = JSON.stringify(data);
  const uncompressed = new Blob([jsonString]).size;
  
  // 估算压缩率（gzip 通常能达到 70-90% 压缩率）
  const estimatedCompressed = Math.floor(uncompressed * 0.3);
  
  return {
    uncompressed,
    estimatedCompressed,
  };
}

