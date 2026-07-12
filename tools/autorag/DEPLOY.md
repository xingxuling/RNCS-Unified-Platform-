# 部署說明

## 項目類型
Python 應用

## 環境要求
- Python 3.8+
- pip (Python 包管理器)

## 部署步驟
1. 安裝 Python3
2. 安裝依賴: `pip3 install -r requirements.txt`
3. 運行: `./start.sh`
4. 或手動運行主程序

## 使用虛擬環境（推薦）
```bash
# 創建虛擬環境
python3 -m venv venv

# 激活虛擬環境
source venv/bin/activate  # Linux/Mac
# 或
venv\Scripts\activate     # Windows

# 安裝依賴
pip install -r requirements.txt

# 運行應用
python3 main.py
```

## 常見問題
1. 如果 pip 未安裝: `python3 -m ensurepip`
2. 權限問題: 使用虛擬環境
3. 依賴衝突: 使用虛擬環境隔離
