#!/usr/bin/env python3
"""
UI 組件生成引擎
自動生成 React/React Native UI 組件
"""

import os
import json
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime

class UIGenerator:
    """UI 組件生成引擎"""
    
    def __init__(self, project_path: str):
        self.project_path = Path(project_path)
    
    def generate_button(self) -> Dict[str, Any]:
        """生成按鈕組件"""
        print("🧩 生成按鈕組件...")
        
        # 創建目錄
        ui_dir = self.project_path / "src" / "components" / "ui"
        ui_dir.mkdir(parents=True, exist_ok=True)
        
        # 按鈕組件
        button_file = ui_dir / "Button.tsx"
        button_content = """import React from 'react';
import { TouchableOpacity, Text, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  disabled = false,
  variant = 'primary',
  style,
  textStyle
}) => {
  const getButtonStyle = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: disabled ? '#CCCCCC' : '#007AFF',
          padding: 12,
          borderRadius: 8,
          alignItems: 'center',
        };
      case 'secondary':
        return {
          backgroundColor: disabled ? '#CCCCCC' : '#6C757D',
          padding: 12,
          borderRadius: 8,
          alignItems: 'center',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: disabled ? '#CCCCCC' : '#007AFF',
          padding: 12,
          borderRadius: 8,
          alignItems: 'center',
        };
      default:
        return {
          backgroundColor: disabled ? '#CCCCCC' : '#007AFF',
          padding: 12,
          borderRadius: 8,
          alignItems: 'center',
        };
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'outline':
        return {
          color: disabled ? '#CCCCCC' : '#007AFF',
          fontSize: 16,
          fontWeight: '600',
        };
      default:
        return {
          color: '#FFFFFF',
          fontSize: 16,
          fontWeight: '600',
        };
    }
  };

  return (
    <TouchableOpacity
      style={{ ...getButtonStyle(), ...style }}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={{ ...getTextStyle(), ...textStyle }}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};
"""
        
        with open(button_file, 'w', encoding='utf-8') as f:
            f.write(button_content)
        
        print(f"  ✅ 按鈕組件已生成: {button_file}")
        
        return {
            "file": str(button_file),
            "type": "Button",
            "props": ["title", "onPress", "disabled", "variant", "style", "textStyle"]
        }
    
    def generate_card(self) -> Dict[str, Any]:
        """生成卡片組件"""
        print("🧩 生成卡片組件...")
        
        ui_dir = self.project_path / "src" / "components" / "ui"
        ui_dir.mkdir(parents=True, exist_ok=True)
        
        card_file = ui_dir / "Card.tsx"
        card_content = """import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  elevation?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  style,
  titleStyle,
  subtitleStyle,
  elevation = 2,
}) => {
  const getCardStyle = () => {
    return {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: elevation,
      },
      shadowOpacity: 0.1,
      shadowRadius: elevation * 2,
      elevation: elevation,
    };
  };

  return (
    <View style={{ ...getCardStyle(), ...style }}>
      {title && (
        <Text
          style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: '#333333',
            marginBottom: subtitle ? 4 : 12,
            ...titleStyle,
          }}
        >
          {title}
        </Text>
      )}
      
      {subtitle && (
        <Text
          style={{
            fontSize: 14,
            color: '#666666',
            marginBottom: 12,
            ...subtitleStyle,
          }}
        >
          {subtitle}
        </Text>
      )}
      
      <View>
        {children}
      </View>
    </View>
  );
};
"""
        
        with open(card_file, 'w', encoding='utf-8') as f:
            f.write(card_content)
        
        print(f"  ✅ 卡片組件已生成: {card_file}")
        
        return {
            "file": str(card_file),
            "type": "Card",
            "props": ["children", "title", "subtitle", "style", "titleStyle", "subtitleStyle", "elevation"]
        }
    
    def generate_input(self) -> Dict[str, Any]:
        """生成輸入框組件"""
        print("🧩 生成輸入框組件...")
        
        ui_dir = self.project_path / "src" / "components" / "ui"
        ui_dir.mkdir(parents=True, exist_ok=True)
        
        input_file = ui_dir / "Input.tsx"
        input_content = """import React from 'react';
import { TextInput, View, Text, ViewStyle, TextStyle, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  labelStyle,
  errorStyle,
  style,
  ...textInputProps
}) => {
  const getInputStyle = () => {
    return {
      flex: 1,
      padding: 12,
      fontSize: 16,
      color: '#333333',
    };
  };

  const getContainerStyle = () => {
    return {
      borderWidth: 1,
      borderColor: error ? '#FF3B30' : '#E0E0E0',
      borderRadius: 8,
      backgroundColor: '#FFFFFF',
    };
  };

  return (
    <View style={{ marginBottom: 16, ...containerStyle }}>
      {label && (
        <Text
          style={{
            fontSize: 14,
            fontWeight: '500',
            color: '#666666',
            marginBottom: 8,
            ...labelStyle,
          }}
        >
          {label}
        </Text>
      )}
      
      <View style={{ ...getContainerStyle(), ...style }}>
        <TextInput
          style={{ ...getInputStyle() }}
          placeholderTextColor="#999999"
          {...textInputProps}
        />
      </View>
      
      {error && (
        <Text
          style={{
            fontSize: 12,
            color: '#FF3B30',
            marginTop: 4,
            ...errorStyle,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
};
"""
        
        with open(input_file, 'w', encoding='utf-8') as f:
            f.write(input_content)
        
        print(f"  ✅ 輸入框組件已生成: {input_file}")
        
        return {
            "file": str(input_file),
            "type": "Input",
            "props": ["label", "error", "containerStyle", "labelStyle", "errorStyle", "...textInputProps"]
        }
    
    def generate_ui_library(self) -> Dict[str, Any]:
        """生成 UI 組件庫"""
        print("📚 生成 UI 組件庫...")
        
        results = {
            "components_generated": 0,
            "files_created": [],
            "library_path": ""
        }
        
        # 創建 UI 目錄
        ui_dir = self.project_path / "src" / "components" / "ui"
        ui_dir.mkdir(parents=True, exist_ok=True)
        
        results["library_path"] = str(ui_dir)
        
        # 生成組件
        components = [
            self.generate_button(),
            self.generate_card(),
            self.generate_input()
        ]
        
        results["components_generated"] = len(components)
        
        for component in components:
            results["files_created"].append(component["file"])
        
        # 創建索引文件
        index_file = ui_dir / "index.ts"
        index_content = """// UI Component Library
// Auto-generated on """ + datetime.now().strftime("%Y-%m-%d %H:%M:%S") + """

export { Button } from './Button';
export { Card } from './Card';
export { Input } from './Input';

// Re-export all components
export * from './Button';
export * from './Card';
export * from './Input';
"""
        
        with open(index_file, 'w', encoding='utf-8') as f:
            f.write(index_content)
        
        results["files_created"].append(str(index_file))
        
        print(f"  ✅ UI 組件庫已生成: {ui_dir}")
        print(f"    組件數量: {results['components_generated']}")
        print(f"    文件數量: {len(results['files_created'])}")
        
        return results
    
    def analyze_ui(self) -> Dict[str, Any]:
        """分析 UI 組件"""
        print("🔍 分析 UI 組件...")
        
        analysis = {
            "has_ui_directory": False,
            "ui_components": 0,
            "suggestions": []
        }
        
        # 檢查 UI 目錄
        ui_dir = self.project_path / "src" / "components" / "ui"
        if ui_dir.exists():
            analysis["has_ui_directory"] = True
            
            # 統計組件
            component_files = list(ui_dir.glob("*.tsx")) + list(ui_dir.glob("*.jsx"))
            analysis["ui_components"] = len(component_files)
        
        # 生成建議
        if not analysis["has_ui_directory"]:
            analysis["suggestions"].append("創建 UI 組件目錄")
        
        if analysis["ui_components"] < 3:
            analysis["suggestions"].append("添加基礎 UI 組件")
        
        return analysis


def main():
    """主函數"""
    import sys
    
    if len(sys.argv) < 2:
        print("用法: python ui_generator.py <項目路徑> [命令]")
        print("命令:")
        print("  analyze - 分析 UI")
        print("  library - 生成 UI 組件庫")
        sys.exit(1)
    
    project_path = sys.argv[1]
    
    if not os.path.exists(project_path):
        print(f"錯誤: 項目路徑不存在: {project_path}")
        sys.exit(1)
    
    generator = UIGenerator(project_path)
    
    if len(sys.argv) == 2 or sys.argv[2] == "analyze":
        # 分析 UI
        analysis = generator.analyze_ui()
        
        print("\n📊 UI 分析結果:")
        print(f"UI 目錄: {'✅ 存在' if analysis['has_ui_directory'] else '❌ 不存在'}")
        print(f"UI 組件: {analysis['ui_components']} 個")
        
        if analysis["suggestions"]:
            print("\n💡 建議:")
            for suggestion in analysis["suggestions"]:
                print(f"  • {suggestion}")
    
    elif sys.argv[2] == "library":
        # 生成 UI 組件庫
        result = generator.generate_ui_library()
        
        print(f"\n✅ UI 組件庫生成完成:")
        print(f"路徑: {result['library_path']}")
        print(f"組件: {result['components_generated']} 個")
        print(f"文件: {len(result['files_created'])} 個")


if __name__ == "__main__":
    main()