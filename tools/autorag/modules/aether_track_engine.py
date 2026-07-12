"""
Aether Track Engine - 结构预测引擎集成模块
将 aether-track-engine 的核心功能集成到 auto-rag-system 中
"""

from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import re
import json
import random


class ForecastType:
    """预测类型"""
    RESULT = "RESULT"  # 事件线：可见结果
    ACTIVATION = "ACTIVATION"  # 结构线：身份转换
    DUAL = "DUAL"  # 双轨：同时包含


class SignalType:
    """信号类型"""
    SYSTEM_STATUS = "system_status"
    EMAIL = "email"
    HEXAGRAM = "hexagram"
    EMOTION = "emotion"
    RANDOM_EVENT = "random_event"
    OTHER = "other"


class DoorType:
    """八门类型"""
    KAI = "开"  # 全面开放
    XIU = "休"  # 休养生息
    SHENG = "生"  # 生机盎然
    SHANG = "伤"  # 有损耗风险
    DU = "杜"  # 暂时封闭
    JING = "景"  # 表象明亮
    SI = "死"  # 此路不通
    JING_SHOCK = "惊"  # 变数较大


class MomentumPhase:
    """十二长生阶段"""
    CHANG_SHENG = "长生"
    MU_YU = "沐浴"
    GUAN_DAI = "冠带"
    LIN_GUAN = "临官"
    DI_WANG = "帝旺"
    SHUAI = "衰"
    BING = "病"
    SI = "死"
    MU = "墓"
    JUE = "绝"
    TAI = "胎"
    YANG = "养"


class ActionPermission:
    """行动许可"""
    HOLD = "HOLD"  # 持守观望
    INTERNAL_PREP = "INTERNAL_PREP"  # 内部准备
    EXECUTE_SHADOW = "EXECUTE_SHADOW"  # 暗中推进
    EXECUTE_VISIBLE = "EXECUTE_VISIBLE"  # 显性执行


class DTFMEngine:
    """DTFM 时间分解层引擎"""
    
    def __init__(self):
        self.result_keywords = [
            "通知", "结果", "批准", "回信", "offer", "email", "邮件", 
            "回复", "答复", "信息", "消息", "什么时候到", "何时", "when"
        ]
        self.activation_keywords = [
            "入学", "开始", "进入", "启动", "身份", "阶段", "生效", 
            "正式", "开工", "上班", "报到", "enroll", "start", "begin"
        ]
    
    def classify_intent(self, question: str) -> str:
        """分类意图：事件 or 结构 or 双轨"""
        q = question.lower()
        has_result = any(k in q for k in self.result_keywords)
        has_activation = any(k in q for k in self.activation_keywords)
        
        if has_result and has_activation:
            return ForecastType.DUAL
        elif has_activation:
            return ForecastType.ACTIVATION
        return ForecastType.RESULT
    
    def infer_weight(self, signal_type: str) -> float:
        """推断信号权重"""
        weights = {
            SignalType.SYSTEM_STATUS: 0.85,
            SignalType.EMAIL: 0.85,
            SignalType.HEXAGRAM: 0.75,
            SignalType.EMOTION: 0.6,
            SignalType.RANDOM_EVENT: 0.4,
            SignalType.OTHER: 0.5
        }
        return weights.get(signal_type, 0.5)
    
    def compute_result_line(
        self, 
        question: str, 
        context: str, 
        forecast_id: str
    ) -> Dict[str, Any]:
        """计算事件线"""
        intent = self.classify_intent(question)
        
        # 基于问题关键词推断时间窗口
        urgency = self._detect_urgency(question + context)
        base_offset = 3 + (1 - urgency) * 7
        window_width = 5 if intent == ForecastType.RESULT else 10
        
        now = datetime.now()
        start_date = now + timedelta(days=int(base_offset))
        end_date = start_date + timedelta(days=window_width)
        
        confidence = 0.6 + urgency * 0.3
        
        return {
            "forecastId": forecast_id,
            "windowStart": start_date.strftime("%Y-%m-%d"),
            "windowEnd": end_date.strftime("%Y-%m-%d"),
            "confidence": min(confidence, 1.0),
            "evidenceRefs": ["问题类型分析", "时间节律推断", "结构模式匹配"],
            "explanation": "事件线对应可见文本/系统状态的释放窗口"
        }
    
    def compute_activation_line(
        self,
        question: str,
        context: str,
        result_line: Dict[str, Any],
        forecast_id: str
    ) -> Dict[str, Any]:
        """计算结构线"""
        shift_detected = self._detect_attention_shift(context)
        result_end = datetime.strptime(result_line["windowEnd"], "%Y-%m-%d")
        
        start_offset = 5 if shift_detected else 10
        window_width = 10 if shift_detected else 14
        
        window_start = result_end + timedelta(days=start_offset)
        window_end = window_start + timedelta(days=window_width)
        
        confidence = 0.55 + random.random() * 0.35
        
        markers = [
            '系统开始以新身份推送信息',
            '注意力资源自然重新分配',
            '旧结构执念自然下降'
        ]
        if shift_detected:
            markers.append('已检测到注意力转移信号')
        else:
            markers.append('等待结构切换触发')
        
        return {
            "forecastId": forecast_id,
            "windowStart": window_start.strftime("%Y-%m-%d"),
            "windowEnd": window_end.strftime("%Y-%m-%d"),
            "confidence": min(confidence, 1.0),
            "activationMarkers": markers,
            "explanation": "结构线对应身份/节律被系统视为已切换的区间"
        }
    
    def _detect_urgency(self, text: str) -> float:
        """检测紧急程度"""
        urgency_indicators = {
            "紧急": 0.9, "尽快": 0.85, "今天": 0.8, "明天": 0.75,
            "本周": 0.7, "本月": 0.6, "尽快": 0.85, "急": 0.85,
            "wait": 0.3, "等待": 0.3, "等": 0.3, "不急": 0.2
        }
        
        max_urgency = 0.5  # 默认中等紧急
        for keyword, value in urgency_indicators.items():
            if keyword in text.lower():
                max_urgency = max(max_urgency, value)
        
        return max_urgency
    
    def _detect_attention_shift(self, text: str) -> bool:
        """检测注意力转移"""
        shift_indicators = ['注意力', '开始想', '突然', '转向', '准备', '计划']
        return any(ind in text for ind in shift_indicators)


class QSDMEngine:
    """QSDM 行动动力学层引擎"""
    
    DOOR_STATES = {
        DoorType.KAI: {"door": "开", "interface": "Open", "desc": "全面开放，可显性行动"},
        DoorType.XIU: {"door": "休", "interface": "Open", "desc": "休养生息，适合柔性推进"},
        DoorType.SHENG: {"door": "生", "interface": "Open", "desc": "生机盎然，利于创新启动"},
        DoorType.SHANG: {"door": "伤", "interface": "Dangerous", "desc": "有损耗风险，需谨慎评估"},
        DoorType.DU: {"door": "杜", "interface": "Closed-but-Openable", "desc": "暂时封闭，可通过策略打开"},
        DoorType.JING: {"door": "景", "interface": "Closed-but-Openable", "desc": "表象明亮，需看清本质"},
        DoorType.SI: {"door": "死", "interface": "Blocked", "desc": "此路不通，需另寻出路"},
        DoorType.JING_SHOCK: {"door": "惊", "interface": "Dangerous", "desc": "变数较大，可能有意外"},
    }
    
    def infer_qsdm_state(
        self,
        question: str,
        context: str,
        result_line: Dict[str, Any],
        activation_line: Dict[str, Any]
    ) -> Dict[str, Any]:
        """推断 QSDM 状态"""
        
        # 推断身份状态
        identity = self._infer_identity(question, context)
        
        # 推断门状态
        door = self._infer_door(question, context, result_line["confidence"])
        
        # 推断动量状态
        momentum = self._infer_momentum(result_line, activation_line)
        
        # 推断调制器
        modulator = self._infer_modulator(question, context)
        
        # 计算行动授权
        auth = self._compute_authorization(
            activation_line["confidence"],
            momentum,
            door,
            identity
        )
        
        return {
            "identity": identity,
            "door": door,
            "momentum": momentum,
            "modulator": modulator,
            "actionType": auth,
            "authorizationScore": auth["score"],
            "authorizationFormula": auth["formula"]
        }
    
    def _infer_identity(self, question: str, context: str) -> Dict[str, Any]:
        """推断身份状态"""
        role_patterns = [
            (r'申请|录取|offer', 'Applicant', 'Enrolled'),
            (r'入职|工作', 'Candidate', 'Employee'),
            (r'毕业|学业', 'Student', 'Graduate'),
            (r'项目|启动', 'Planner', 'Executor'),
        ]
        
        current = "Current"
        next_role = "Next (pending)"
        
        for pattern, cur, nxt in role_patterns:
            if re.search(pattern, question + context, re.IGNORECASE):
                current = cur
                next_role = nxt
                break
        
        return {
            "currentRole": current,
            "nextRole": next_role,
            "fiveElements": {
                "wood": 0.2,
                "fire": 0.15,
                "earth": 0.25,
                "metal": 0.2,
                "water": 0.2
            }
        }
    
    def _infer_door(
        self, 
        question: str, 
        context: str, 
        confidence: float
    ) -> Dict[str, Any]:
        """推断门状态"""
        anxiety_level = len(re.findall(r'焦虑|担心|等待|着急', context))
        positive_level = len(re.findall(r'确定|批准|通过|顺利|积极', question + context))
        
        if confidence > 0.75 and positive_level > anxiety_level:
            door_type = DoorType.KAI
        elif confidence > 0.65 and positive_level >= anxiety_level:
            door_type = DoorType.SHENG
        elif confidence > 0.55:
            door_type = DoorType.XIU
        elif anxiety_level > 2:
            door_type = DoorType.DU
        elif confidence < 0.4:
            door_type = DoorType.JING
        else:
            door_type = DoorType.XIU
        
        return self.DOOR_STATES[door_type]
    
    def _infer_momentum(
        self,
        result_line: Dict[str, Any],
        activation_line: Dict[str, Any]
    ) -> Dict[str, Any]:
        """推断动量状态"""
        now = datetime.now()
        result_start = datetime.strptime(result_line["windowStart"], "%Y-%m-%d")
        activation_start = datetime.strptime(activation_line["windowStart"], "%Y-%m-%d")
        
        days_to_result = (result_start - now).days
        avg_confidence = (result_line["confidence"] + activation_line["confidence"]) / 2
        
        if days_to_result <= 3 and avg_confidence > 0.7:
            current = MomentumPhase.LIN_GUAN
            next_phase = MomentumPhase.DI_WANG
            level = "High"
        elif days_to_result <= 7 and avg_confidence > 0.6:
            current = MomentumPhase.GUAN_DAI
            next_phase = MomentumPhase.LIN_GUAN
            level = "Medium"
        elif days_to_result <= 14:
            current = MomentumPhase.MU_YU
            next_phase = MomentumPhase.GUAN_DAI
            level = "Low"
        else:
            current = MomentumPhase.CHANG_SHENG
            next_phase = MomentumPhase.MU_YU
            level = "Low"
        
        return {
            "currentPhase": current,
            "nextPhase": next_phase,
            "level": level,
            "trend": "ascending"
        }
    
    def _infer_modulator(self, question: str, context: str) -> Dict[str, Any]:
        """推断调制器"""
        stars = {
            r'学术|研究|教授|论文': "天辅",
            r'决策|选择|判断': "天心",
            r'快速|紧急|加速': "天冲",
            r'隐蔽|私下|暗中': "天蓬",
            r'展示|表现|公开': "天英",
            r'稳定|长期|坚持': "天任"
        }
        
        star = "天禽"  # 默认
        for pattern, name in stars.items():
            if re.search(pattern, question + context, re.IGNORECASE):
                star = name
                break
        
        return {
            "star": star,
            "effect": f"九星{star}调制效应"
        }
    
    def _compute_authorization(
        self,
        activation_confidence: float,
        momentum: Dict[str, Any],
        door: Dict[str, Any],
        identity: Dict[str, Any]
    ) -> Dict[str, Any]:
        """计算行动授权"""
        momentum_score = {
            "Critical": 0.1,
            "Low": 0.3,
            "Medium": 0.5,
            "High": 0.8,
            "Peak": 1.0
        }[momentum["level"]]
        
        door_score = {
            "Open": 1.0,
            "Closed-but-Openable": 0.5,
            "Dangerous": 0.3,
            "Blocked": 0.0
        }[door["interface"]]
        
        score = min(1.0, max(0, 
            activation_confidence * 0.3 +
            momentum_score * 0.35 +
            door_score * 0.25 +
            0.7 * 0.1  # 身份对齐
        ))
        
        if door["interface"] == "Blocked":
            permission = ActionPermission.HOLD
        elif score >= 0.75 and door["interface"] == "Open":
            permission = ActionPermission.EXECUTE_VISIBLE
        elif score >= 0.55 and door_score >= 0.5:
            permission = ActionPermission.EXECUTE_SHADOW
        elif score >= 0.35:
            permission = ActionPermission.INTERNAL_PREP
        else:
            permission = ActionPermission.HOLD
        
        action_types = {
            ActionPermission.HOLD: {
                "label": "持守观望",
                "description": "当前不具备行动条件，需等待时机",
                "allowed": ["内部准备", "文档整理", "模型构建", "观察等待"],
                "prohibited": ["公开争取", "情绪化追问", "扩大曝光", "主动出击"]
            },
            ActionPermission.INTERNAL_PREP: {
                "label": "内部准备",
                "description": "可进行隐性准备工作，不宜外显",
                "allowed": ["联系关键节点", "完善材料", "内部对接", "信息收集"],
                "prohibited": ["公开发布", "广泛宣传", "正式申请"]
            },
            ActionPermission.EXECUTE_SHADOW: {
                "label": "暗中推进",
                "description": "可定向、低调地推进关键事项",
                "allowed": ["定向邮件", "私下会谈", "内部提交", "小范围试探"],
                "prohibited": ["公开宣告", "大规模行动", "高调展示"]
            },
            ActionPermission.EXECUTE_VISIBLE: {
                "label": "显性执行",
                "description": "条件成熟，可全面推进",
                "allowed": ["发布", "申请", "谈判", "公开推进", "正式启动"],
                "prohibited": []
            }
        }
        
        return {
            "permission": permission,
            "label": action_types[permission]["label"],
            "description": action_types[permission]["description"],
            "allowedActions": action_types[permission]["allowed"],
            "prohibitedActions": action_types[permission]["prohibited"],
            "score": score,
            "formula": f"IF Confidence({activation_confidence*100:.0f}%) >= 55% AND Momentum({momentum['level']}) >= Medium AND Door({door['door']}) != DEAD THEN Action := ?"
        }


class EdgeSignalGenerator:
    """边缘信号生成器"""
    
    def generate_signals(
        self,
        question: str,
        context: str,
        result_line: Dict[str, Any],
        activation_line: Dict[str, Any]
    ) -> List[Dict[str, str]]:
        """生成边缘信号"""
        signals = [
            {
                "signal": "系统或门户出现轻微但无法解释的状态变化",
                "whyItMatters": "常见于结构即将激活前的同步过程",
                "howToVerify": "截图 + 时间戳比对，记录任何 UI 或状态的微小变化",
                "category": "system_anomaly"
            },
            {
                "signal": "你对「结果本身」的执念自然下降，开始想别的事",
                "whyItMatters": "Result Line 已在心理层结束",
                "howToVerify": "记录今天你主动查进度的次数，是否比昨天少",
                "category": "attention_shift"
            },
            {
                "signal": "收到与核心问题无关的行政/通知信息",
                "whyItMatters": "系统开始将你纳入下一阶段信息流",
                "howToVerify": "检查邮件/通知的类型变化",
                "category": "admin_noise"
            },
            {
                "signal": "他人无意间提及相关机构/人物/话题",
                "whyItMatters": "社会层面的前激活共振",
                "howToVerify": "记录今天谁跟你提了相关的事",
                "category": "relation_mention"
            },
            {
                "signal": "短暂疲惫、作息改变、或身体微妙不适",
                "whyItMatters": "结构切换期的身体配载反应",
                "howToVerify": "记录昨晚睡眠质量和今天精力波动",
                "category": "body_state"
            },
            {
                "signal": "随机延误或取消的小事件",
                "whyItMatters": "旧结构释放资源的常见副作用",
                "howToVerify": "对照今天有没有意外取消或推迟的事项",
                "category": "adaptive"
            },
            {
                "signal": "突然开始规划「之后」的事情",
                "whyItMatters": "Activation Line 已在认知层启动",
                "howToVerify": "查看最近24小时你做了什么「假设结果已确定」的决策",
                "category": "adaptive"
            }
        ]
        
        # 根据问题类型添加特定信号
        if re.search(r'offer|录取|学', question, re.IGNORECASE):
            signals.append({
                "signal": "开始关注住宿/选课/交通等「入学后」事项",
                "whyItMatters": "认知层已经跳过等待，进入下一阶段规划",
                "howToVerify": "你今天有没有搜索过与「入学后」相关的信息",
                "category": "adaptive"
            })
        
        if re.search(r'等|焦虑|担心', context):
            signals.append({
                "signal": "焦虑感突然减轻，出现「无所谓」或「顺其自然」的念头",
                "whyItMatters": "情绪层的结构切换完成",
                "howToVerify": "对比今天和昨天的情绪状态",
                "category": "adaptive"
            })
        
        return signals


class AetherTrackEngine:
    """Aether Track Engine 主引擎"""
    
    def __init__(self):
        self.dtfm = DTFMEngine()
        self.qsdm = QSDMEngine()
        self.edge_gen = EdgeSignalGenerator()
    
    def analyze(
        self,
        question: str,
        context: str = "",
        forecast_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        分析预测请求
        
        Args:
            question: 核心问题
            context: 背景信息
            forecast_id: 预测ID（可选）
        
        Returns:
            完整的分析结果
        """
        if forecast_id is None:
            forecast_id = f"forecast_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # DTFM 分析
        result_line = self.dtfm.compute_result_line(question, context, forecast_id)
        activation_line = self.dtfm.compute_activation_line(
            question, context, result_line, forecast_id
        )
        
        # QSDM 分析
        qsdm = self.qsdm.infer_qsdm_state(
            question, context, result_line, activation_line
        )
        
        # 生成边缘信号
        edge_signals = self.edge_gen.generate_signals(
            question, context, result_line, activation_line
        )
        
        # 生成 Aether 脚本
        aether_script = self._compile_aether_script(
            question, context, result_line, activation_line, edge_signals, qsdm
        )
        
        return {
            "forecastId": forecast_id,
            "question": question,
            "context": context,
            "resultLine": result_line,
            "activationLine": activation_line,
            "edgeSignals": edge_signals,
            "qsdm": qsdm,
            "aetherScript": aether_script,
            "createdAt": datetime.now().isoformat()
        }
    
    def _compile_aether_script(
        self,
        question: str,
        context: str,
        result_line: Dict[str, Any],
        activation_line: Dict[str, Any],
        edge_signals: List[Dict[str, str]],
        qsdm: Dict[str, Any]
    ) -> str:
        """编译 Aether 脚本"""
        script = f"""# ============================================
# ADQ Engine Forecast Script (DTFM × QSDM × Aether)
# Generated: {datetime.now().isoformat()}
# Engine: ADQ v0.3
# ============================================

ROLE:
  {qsdm['identity']['currentRole']} -> {qsdm['identity']['nextRole']}

QUESTION:
  "{question}"

CONTEXT:
  "{context or '无额外上下文'}"

# ============================================
# DTFM: 双轨时间分解
# ============================================

## EVENT LINE (Result Line)

EVENT:
  ResultNotice := "收到正式通知 / 系统状态变更 / 可见文本释放"

WINDOW_RESULT:
  Start: {result_line['windowStart']}
  End:   {result_line['windowEnd']}
  Confidence: {result_line['confidence']*100:.0f}%

## ACTIVATION LINE (Structure Line)

ACTIVATION:
  StructureActivation := "系统开始以新身份推送信息"

WINDOW_ACTIVATION:
  Start: {activation_line['windowStart']}
  End:   {activation_line['windowEnd']}
  Confidence: {activation_line['confidence']*100:.0f}%

ACTIVATION_MARKERS:
"""

        for marker in activation_line['activationMarkers']:
            script += f"  - {marker}\n"
        
        script += f"""
# ============================================
# QSDM: 行动动力学分析
# ============================================

IDENTITY:
  Current: {qsdm['identity']['currentRole']}
  Next: {qsdm['identity']['nextRole']}

DOOR:
  Type: {qsdm['door']['door']}
  Interface: {qsdm['door']['interface']}
  Description: "{qsdm['door']['desc']}"

MOMENTUM:
  Current: {qsdm['momentum']['currentPhase']}
  Next: {qsdm['momentum']['nextPhase']}
  Level: {qsdm['momentum']['level']}
  Trend: {qsdm['momentum']['trend']}

MODULATOR:
  Star: {qsdm['modulator']['star']}
  Effect: "{qsdm['modulator']['effect']}"

# ============================================
# ACTION AUTHORIZATION
# ============================================

AUTHORIZATION_FORMULA:
{qsdm['authorizationFormula']}

AUTHORIZATION_RESULT:
  Permission: {qsdm['actionType']['permission']}
  Label: {qsdm['actionType']['label']}
  Score: {qsdm['actionType']['score']*100:.0f}%
  Description: "{qsdm['actionType']['description']}"

ALLOWED_ACTIONS:
"""

        for action in qsdm['actionType']['allowedActions']:
            script += f"  ✓ {action}\n"
        
        script += "PROHIBITED_ACTIONS:\n"
        for action in qsdm['actionType']['prohibitedActions']:
            script += f"  ✗ {action}\n"
        
        script += """
# ============================================
# EDGE SIGNALS
# ============================================

EDGE_SIGNALS:
"""

        for signal in edge_signals:
            script += f"""
  - Signal: "{signal['signal']}"
    Why: "{signal['whyItMatters']}"
    Verify: "{signal['howToVerify']}"
"""
        
        script += f"""
# ============================================
# NEXT ACTIONS
# ============================================

NEXT_ACTION:
  - "当前许可级别: {qsdm['actionType']['label']}"
  - "在 WINDOW_RESULT [{result_line['windowStart']} ~ {result_line['windowEnd']}] 期间每日检查一次"
  - "优先执行: {' / '.join(qsdm['actionType']['allowedActions'][:2])}"
  - "记录 Edge Signals 出现时间"

# ============================================
# META
# ============================================

META:
  GeneratedAt: {datetime.now().isoformat()}
  Engine: ADQ v0.3
  AuthorizationScore: {qsdm['actionType']['score']*100:.0f}%
  ActionPermission: {qsdm['actionType']['permission']}

# END OF SCRIPT
"""
        return script


# 便捷函数
def analyze_forecast(question: str, context: str = "") -> Dict[str, Any]:
    """
    便捷函数：分析预测
    
    Args:
        question: 核心问题
        context: 背景信息
    
    Returns:
        分析结果字典
    """
    engine = AetherTrackEngine()
    return engine.analyze(question, context)


if __name__ == "__main__":
    # 测试示例
    result = analyze_forecast(
        question="A轮融资什么时候能close？",
        context="已与8家VC接触，3家给TS，目前2家在做DD。团队希望6周内完成。"
    )
    
    print("=== Aether Track Engine 分析结果 ===")
    print(f"预测ID: {result['forecastId']}")
    print(f"\n事件线: {result['resultLine']['windowStart']} ~ {result['resultLine']['windowEnd']}")
    print(f"结构线: {result['activationLine']['windowStart']} ~ {result['activationLine']['windowEnd']}")
    print(f"\n行动许可: {result['qsdm']['actionType']['label']}")
    print(f"授权分数: {result['qsdm']['actionType']['score']*100:.0f}%")
    print(f"\n边缘信号数量: {len(result['edgeSignals'])}")
