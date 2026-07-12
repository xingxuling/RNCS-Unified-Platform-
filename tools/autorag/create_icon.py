#!/usr/bin/env python3
"""
創建 RAG 系統圖標
"""

try:
    from PIL import Image, ImageDraw, ImageFont
    import os
    
    # 創建圖像
    img = Image.new('RGB', (256, 256), color='#2c3e50')
    draw = ImageDraw.Draw(img)
    
    # 嘗試加載字體
    try:
        font = ImageFont.truetype("arial.ttf", 80)
    except:
        font = ImageFont.load_default()
    
    # 繪製文字
    draw.text((128, 128), "RAG", fill='#3498db', font=font, anchor="mm")
    
    # 保存圖標
    img.save('rag_icon.png')
    print("✅ 圖標已創建: rag_icon.png")
    
    # 如果需要 ICO 格式
    img.save('rag_icon.ico', format='ICO')
    print("✅ 圖標已創建: rag_icon.ico")
    
except ImportError:
    print("⚠️  PIL 庫未安裝，無法創建圖標")
    print("   您可以手動創建圖標文件，或使用現有圖標")
    
    # 創建簡單的文本說明
    with open('rag_icon.txt', 'w') as f:
        f.write("RAG 系統圖標\n")
        f.write("請手動創建 rag_icon.ico 文件\n")
        f.write("或從網上下載合適的圖標\n")
    
    print("✅ 已創建圖標說明文件")