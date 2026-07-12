# RAG 自動化系統 Docker 鏡像
# 版本: 1.0.0

FROM python:3.9-slim

# 設置環境變量
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# 設置工作目錄
WORKDIR /app

# 安裝系統依賴
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    && rm -rf /var/lib/apt/lists/*

# 複製依賴文件
COPY requirements.txt .

# 安裝 Python 依賴
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 複製應用代碼
COPY . .

# 創建必要的目錄
RUN mkdir -p output logs

# 設置權限
RUN chmod +x start.sh && \
    chmod +x *.sh 2>/dev/null || true

# 暴露端口
EXPOSE 8080

# 健康檢查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# 默認啟動命令
CMD ["python", "main.py", "test-project"]

# 可選啟動命令
# 1. 基礎分析: docker run -it rag-system python main.py <項目路徑>
# 2. 增強分析: docker run -it rag-system python main_enhanced.py <項目路徑>
# 3. 監控系統: docker run -it rag-system python run_monitoring_system.py
# 4. 使用腳本: docker run -it rag-system ./start.sh
