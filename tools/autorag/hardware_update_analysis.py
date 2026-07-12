#!/usr/bin/env python3
"""
硬體更新專用分析腳本
直接調用增強版RAG系統的目標自驅模塊，使用硬體更新特定目標
"""

import os
import sys
import json
from pathlib import Path
from datetime import datetime

# 添加模塊路徑
sys.path.insert(0, str(Path(__file__).parent / "modules"))

from goal_driven_module import GoalDrivenModule

class HardwareUpdateGoalModule(GoalDrivenModule):
    """硬體更新專用目標模塊"""
    
    def _load_goal_definitions(self):
        """載入硬體更新專用目標定義"""
        return {
            "update_drivers": {
                "name": "更新驅動程式",
                "description": "更新系統硬體驅動程式到最新版本",
                "metrics": ["驅動程式版本", "驅動程式相容性", "系統穩定性"],
                "strategies": ["檢查Windows Update", "訪問硬體製造商網站", "使用驅動程式更新工具"],
                "priority": "high",
                "success_criteria": ["所有驅動程式更新到最新穩定版", "系統無驅動程式衝突"]
            },
            "optimize_performance": {
                "name": "優化系統效能",
                "description": "透過驅動程式和設定優化系統效能",
                "metrics": ["CPU使用率", "記憶體使用率", "溫度控制"],
                "strategies": ["安裝最新顯示卡驅動程式", "更新晶片組驅動程式", "優化電源管理設定"],
                "priority": "high",
                "success_criteria": ["系統響應速度提升", "溫度控制在安全範圍"]
            },
            "enhance_security": {
                "name": "增強系統安全性",
                "description": "透過韌體和驅動程式更新增強系統安全性",
                "metrics": ["安全性漏洞修補", "韌體安全性版本", "驅動程式簽章驗證"],
                "strategies": ["安裝安全性更新", "更新有漏洞的驅動程式", "啟用安全啟動"],
                "priority": "high",
                "success_criteria": ["無已知安全性漏洞", "所有驅動程式經過簽章驗證"]
            },
            "wsl2_compatibility": {
                "name": "確保WSL2相容性",
                "description": "確保硬體更新後WSL2正常運作",
                "metrics": ["WSL2啟動成功", "Linux核心功能正常", "檔案系統存取正常"],
                "strategies": ["更新後測試WSL2功能", "檢查Linux核心版本", "備份WSL2資料"],
                "priority": "high",
                "success_criteria": ["WSL2正常啟動和運作", "所有Linux功能正常", "無資料損失"]
            }
        }

def run_hardware_analysis():
    """運行硬體更新分析"""
    print("=" * 70)
    print("🔧 調用增強版RAG系統進行硬體更新分析")
    print("=" * 70)
    
    # 項目路徑
    project_path = "/mnt/c/Users/User/hardware-update-project"
    config_path = os.path.join(project_path, "hardware_config.json")
    
    print(f"📁 項目路徑: {project_path}")
    print(f"⚙️  配置檔案: {config_path}")
    
    # 檢查配置檔案
    if not os.path.exists(config_path):
        print("❌ 硬體配置檔案不存在")
        return
    
    # 讀取硬體配置
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            hardware_config = json.load(f)
        print("✅ 硬體配置讀取成功")
    except Exception as e:
        print(f"❌ 讀取硬體配置失敗: {e}")
        return
    
    # 初始化硬體更新模塊
    hardware_module = HardwareUpdateGoalModule(project_path)
    
    # 創建模擬分析報告
    mock_report = {
        "project_info": {"path": project_path, "name": "hardware-update-project"},
        "structure_analysis": {"total_files": 2, "issues_found": hardware_config.get("issues", [])},
        "overall_assessment": {"overall_score": 50.0, "maturity_level": "hardware_config"}
    }
    
    # 設置硬體更新目標
    hardware_goals = ["update_drivers", "optimize_performance", "enhance_security", "wsl2_compatibility"]
    
    print("\n🎯 設置硬體更新目標:")
    for goal in hardware_goals:
        print(f"  • {goal}")
    
    # 運行目標分析
    print("\n🔍 運行目標分析...")
    goal_analysis = hardware_module.set_goals(hardware_goals, mock_report)
    
    # 生成報告
    goal_report = hardware_module.generate_goal_report(goal_analysis)
    
    # 創建結果目錄
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    results_dir = Path(__file__).parent / "output" / f"hardware_update_{timestamp}"
    results_dir.mkdir(parents=True, exist_ok=True)
    
    # 保存報告
    report_path = results_dir / "hardware_update_analysis.json"
    hardware_module.save_report(goal_report, str(report_path))
    
    print(f"\n✅ 分析完成!")
    print(f"📊 報告已保存至: {report_path}")
    
    # 生成簡明建議
    print("\n" + "=" * 70)
    print("💡 硬體更新建議摘要")
    print("=" * 70)
    
    cpu_info = hardware_config.get("cpu", {})
    print(f"📋 系統配置:")
    print(f"  • CPU: {cpu_info.get('model', '未知')}")
    print(f"  • 記憶體: {hardware_config.get('memory', {}).get('total', '未知')}")
    print(f"  • 顯示卡: {hardware_config.get('graphics', {}).get('integrated', '未知')}")
    
    print(f"\n🎯 更新目標:")
    for goal_key, goal_info in goal_analysis.items():
        goal_name = goal_info.get("definition", {}).get("name", goal_key)
        priority = goal_info.get("priority", "medium")
        print(f"  • {goal_name} ({priority}優先級)")
    
    print(f"\n🚀 建議行動:")
    print("  1. 檢查Windows Update中的驅動程式更新")
    print("  2. 訪問AMD官網下載最新顯示卡驅動程式")
    print("  3. 安裝AMD晶片組驅動程式")
    print("  4. 更新後測試WSL2功能: wsl --shutdown && wsl")
    
    print(f"\n⚠️  注意事項:")
    print("  • WSL2環境中，所有硬體更新需在Windows主機進行")
    print("  • 更新前建立系統還原點")
    print("  • 只從官方來源下載驅動程式")
    print("  • 一次更新一個主要驅動程式，測試後再繼續")
    
    print("\n" + "=" * 70)
    
    # 創建詳細執行計畫
    create_detailed_plan(hardware_config, goal_analysis, results_dir)
    
    return goal_report

def create_detailed_plan(hardware_config, goal_analysis, results_dir):
    """創建詳細執行計畫"""
    plan_content = """# 硬體更新執行計畫

## 系統配置
- **CPU**: {cpu}
- **記憶體**: {memory}
- **顯示卡**: {gpu}
- **環境**: {environment}

## 更新目標
{goals}

## 具體步驟

### 階段1: 準備工作
1. 建立系統還原點
2. 備份重要資料
3. 確保網路連接穩定
4. 準備不斷電供應（可選）

### 階段2: Windows更新
1. 打開"設定" > "更新與安全性" > "Windows Update"
2. 點擊"檢查更新"
3. 安裝所有可用的更新，包括可選的驅動程式更新
4. 重新啟動系統

### 階段3: AMD驅動程式更新
1. 訪問 AMD 官方網站: https://www.amd.com/en/support
2. 選擇您的產品: AMD Ryzen AI 7 350
3. 下載最新版 AMD Adrenalin Edition 驅動程式
4. 運行安裝程式，選擇"完整安裝"
5. 重新啟動系統

### 階段4: 晶片組驅動程式
1. 從AMD官網下載最新晶片組驅動程式
2. 運行安裝程式
3. 重新啟動系統

### 階段5: WSL2驗證
1. 打開命令提示字元（管理員）
2. 執行: `wsl --shutdown`
3. 執行: `wsl`
4. 驗證WSL2正常啟動
5. 測試基本功能: `ls`, `cd`, 檔案存取

### 階段6: 效能測試
1. 運行系統一段時間，觀察穩定性
2. 檢查工作管理員中的資源使用情況
3. 測試常用應用程式的效能

## 風險管理
- 更新失敗時使用系統還原點恢復
- 如遇驅動程式衝突，使用DDU工具完全移除後重新安裝
- WSL2問題可嘗試: `wsl --export` 備份後重新安裝

## 成功標準
- 系統穩定運行無錯誤
- 所有硬體功能正常
- WSL2正常運作
- 效能有所提升
""".format(
        cpu=hardware_config.get("cpu", {}).get("model", "未知"),
        memory=hardware_config.get("memory", {}).get("total", "未知"),
        gpu=hardware_config.get("graphics", {}).get("integrated", "未知"),
        environment="Windows 11 with WSL2 Ubuntu 24.04",
        goals="\n".join([f"- {info.get('definition', {}).get('name', key)}" for key, info in goal_analysis.items()])
    )
    
    plan_path = results_dir / "update_execution_plan.md"
    with open(plan_path, 'w', encoding='utf-8') as f:
        f.write(plan_content)
    
    print(f"📋 詳細執行計畫: {plan_path}")

def main():
    """主函數"""
    try:
        run_hardware_analysis()
    except Exception as e:
        print(f"❌ 分析過程中發生錯誤: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()