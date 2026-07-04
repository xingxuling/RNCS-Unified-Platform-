extends Node

signal recognition_started
signal recognition_result(text: String, spell_id: String, confidence: float)
signal recognition_failed(reason: String)

const SPELLS := {
	"fire_lance": {"name": "火焰长枪", "words": "火焰 长枪 穿刺", "mana": 18.0, "cooldown": 1.3},
	"frost_aegis": {"name": "寒霜护壁", "words": "寒霜 护盾 环绕", "mana": 22.0, "cooldown": 6.0},
	"thunder_chain": {"name": "雷霆锁链", "words": "雷霆 锁链 追踪", "mana": 27.0, "cooldown": 3.8},
	"wind_step": {"name": "风行步", "words": "疾风 步伐 前行", "mana": 14.0, "cooldown": 2.5},
	"healing_light": {"name": "治愈之光", "words": "辉光 生命 复苏", "mana": 25.0, "cooldown": 7.0}
}

var _web_callback

func normalize(text: String) -> String:
	var output := text.to_lower()
	for token in [" ", "，", "。", "！", "？", "、", "·", ",", ".", "!", "?", "_", "-"]:
		output = output.replace(token, "")
	return output

func compile(text: String) -> Dictionary:
	var normalized := normalize(text)
	if _has_any(normalized, ["火焰", "烈火", "fire"]) and _has_any(normalized, ["长枪", "枪", "穿刺", "lance"]):
		return _compiled("fire_lance")
	if _has_any(normalized, ["寒霜", "冰霜", "frost", "ice"]) and _has_any(normalized, ["护盾", "护壁", "盾", "shield"]):
		return _compiled("frost_aegis")
	if _has_any(normalized, ["雷霆", "闪电", "thunder"]) and _has_any(normalized, ["锁链", "链", "追踪", "chain"]):
		return _compiled("thunder_chain")
	if _has_any(normalized, ["疾风", "风", "wind"]) and _has_any(normalized, ["步伐", "前行", "步", "dash"]):
		return _compiled("wind_step")
	if _has_any(normalized, ["辉光", "治愈", "生命", "light"]) and _has_any(normalized, ["复苏", "恢复", "治愈", "heal"]):
		return _compiled("healing_light")
	return {"ok": false, "reason": "INCANTATION_NOT_RECOGNIZED", "llm_calls": 0}

func request_microphone_recognition() -> void:
	if not OS.has_feature("web"):
		recognition_failed.emit("桌面版未绑定离线ASR，请使用文字咏唱；Web导出可调用浏览器语音识别。")
		return
	_web_callback = JavaScriptBridge.create_callback(_on_web_speech)
	var window = JavaScriptBridge.get_interface("window")
	if window == null:
		recognition_failed.emit("WEB_WINDOW_UNAVAILABLE")
		return
	window.rncsVoiceMagicCallback = _web_callback
	recognition_started.emit()
	JavaScriptBridge.eval("""
		(() => {
		  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
		  if (!SR) { window.rncsVoiceMagicCallback('ERROR:UNSUPPORTED'); return; }
		  const r = new SR(); r.lang='zh-CN'; r.interimResults=false;
		  r.onresult = e => window.rncsVoiceMagicCallback(e.results[0][0].transcript);
		  r.onerror = e => window.rncsVoiceMagicCallback('ERROR:' + e.error);
		  r.start();
		})();
	""", true)

func _on_web_speech(args: Array) -> void:
	if args.is_empty():
		recognition_failed.emit("EMPTY_RESULT")
		return
	var text := str(args[0])
	if text.begins_with("ERROR:"):
		recognition_failed.emit(text)
		return
	var result := compile(text)
	if bool(result.get("ok", false)):
		recognition_result.emit(text, str(result.get("spell_id", "")), float(result.get("confidence", 0.0)))
	else:
		recognition_failed.emit(str(result.get("reason", "UNKNOWN")))

func _has_any(text: String, tokens: Array) -> bool:
	for token in tokens:
		if text.contains(str(token)):
			return true
	return false

func _compiled(spell_id: String) -> Dictionary:
	return {
		"ok": true,
		"spell_id": spell_id,
		"spell": SPELLS[spell_id],
		"confidence": 0.96,
		"engine": "deterministic-token-grammar",
		"llm_calls": 0
	}
