"""
工具函数模块
提供跨平台的常用工具函数
"""

import os
from pathlib import Path
import platform

def get_desktop_path() -> Path:
    """
    获取桌面路径，支持Windows和Linux/macOS
    
    Returns:
        Path: 桌面目录的路径
    
    Raises:
        RuntimeError: 如果无法确定桌面路径
    """
    system = platform.system()
    
    if system == "Windows":
        # Windows: 使用CSIDL_DESKTOP
        import ctypes
        from ctypes import wintypes
        
        CSIDL_DESKTOP = 0  # CSIDL_DESKTOPDIRECTORY
        SHGFP_TYPE_CURRENT = 0
        
        buf = ctypes.create_unicode_buffer(wintypes.MAX_PATH)
        ctypes.windll.shell32.SHGetFolderPathW(0, CSIDL_DESKTOP, 0, SHGFP_TYPE_CURRENT, buf)
        desktop_path = Path(buf.value)
        
    else:
        # Linux/macOS: 使用标准桌面路径
        desktop_path = Path.home() / "Desktop"
        
        # 如果Desktop不存在，尝试其他常见位置
        if not desktop_path.exists():
            alt_paths = [
                Path.home() / "桌面",  # 中文桌面
                Path.home() / "public" / "Desktop",  # 某些Linux发行版
            ]
            
            for alt_path in alt_paths:
                if alt_path.exists():
                    desktop_path = alt_path
                    break
    
    # 检查路径是否存在
    if not desktop_path.exists():
        # 如果不存在，尝试创建
        try:
            desktop_path.mkdir(parents=True, exist_ok=True)
        except Exception:
            # 如果创建失败，回退到用户主目录
            desktop_path = Path.home()
    
    return desktop_path


def safe_read_file(file_path: Path, encoding: str = 'utf-8') -> str:
    """
    安全读取文件，支持多种编码
    
    Args:
        file_path: 文件路径
        encoding: 首选编码
    
    Returns:
        str: 文件内容
    
    Raises:
        IOError: 如果读取失败
    """
    encodings = [encoding, 'gbk', 'gb2312', 'latin-1']
    
    for enc in encodings:
        try:
            with open(file_path, 'r', encoding=enc) as f:
                return f.read()
        except UnicodeDecodeError:
            continue
        except Exception as e:
            raise IOError(f"Failed to read file {file_path}: {e}")
    
    raise IOError(f"Could not decode file {file_path} with any supported encoding")


def get_safe_filename(filename: str) -> str:
    """
    获取安全的文件名，移除非法字符
    
    Args:
        filename: 原始文件名
    
    Returns:
        str: 安全的文件名
    """
    import re
    # 移除Windows非法字符
    illegal_chars = r'[<>:"/\\|?*\x00-\x1f]'
    safe_name = re.sub(illegal_chars, '_', filename)
    
    # 移除开头和结尾的空格和点
    safe_name = safe_name.strip('. ')
    
    # 如果为空，返回默认名称
    if not safe_name:
        safe_name = "unnamed"
    
    return safe_name
