extends CanvasLayer

const MOBILE_CONTROLS_SCRIPT = preload("res://scripts/mobile_controls.gd")

var player
var hp_bar: ProgressBar
var mana_bar: ProgressBar
var stamina_bar: ProgressBar
var title_label: Label
var quest_label: Label
var announcement_label: Label
var lock_label: Label
var debug_label: Label
var help_label: Label
var voice_panel: PanelContainer
var voice_input: LineEdit
var voice_status: Label
var mobile_controls: Control
var _mobile_device: bool = false

func _ready() -> void:
	_mobile_device = _is_mobile_device()
	_build_ui()
	WorldState.announcement_posted.connect(_on_announcement)
	VoiceMagic.recognition_result.connect(_on_voice_result)
	VoiceMagic.recognition_failed.connect(_on_voice_failed)
	set_process(true)

func _process(_delta: float) -> void:
	if debug_label != null:
		debug_label.text = "Godot %s · FPS %d · LLM 0 · %s" % [
			Engine.get_version_info().get("string", "?"),
			Engine.get_frames_per_second(),
			"触控" if _mobile_device else "键鼠"
		]

func bind_player(value) -> void:
	player = value
	if player == null:
		return
	if player.has_signal("stats_changed"):
		player.connect("stats_changed", Callable(self, "_on_stats"))
	if player.has_signal("voice_panel_requested"):
		player.connect("voice_panel_requested", Callable(self, "open_voice_panel"))
	if player.has_signal("lock_changed"):
		player.connect("lock_changed", Callable(self, "_on_lock_changed"))
	if mobile_controls != null:
		mobile_controls.connect("move_changed", Callable(self, "_on_mobile_move"))
		mobile_controls.connect("camera_dragged", Callable(self, "_on_mobile_camera"))
		mobile_controls.connect("action_requested", Callable(self, "_on_mobile_action"))
		mobile_controls.connect("spell_requested", Callable(self, "_on_mobile_spell"))
	if player.has_method("_emit_stats"):
		player.call("_emit_stats")

func open_voice_panel() -> void:
	voice_panel.visible = true
	voice_input.grab_focus()
	if _mobile_device and mobile_controls != null:
		mobile_controls.call("set_enabled", false)
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE

func close_voice_panel() -> void:
	voice_panel.visible = false
	if _mobile_device and mobile_controls != null:
		mobile_controls.call("set_enabled", true)
	if not _mobile_device:
		Input.mouse_mode = Input.MOUSE_MODE_CAPTURED

func update_quest(text: String) -> void:
	quest_label.text = text

func _on_stats(data: Dictionary) -> void:
	hp_bar.max_value = float(data.get("max_hp", 100.0))
	hp_bar.value = float(data.get("hp", 0.0))
	mana_bar.max_value = float(data.get("max_mana", 100.0))
	mana_bar.value = float(data.get("mana", 0.0))
	stamina_bar.max_value = float(data.get("max_stamina", 100.0))
	stamina_bar.value = float(data.get("stamina", 0.0))
	title_label.text = "咏唱者 Lv.%d · 金币 %d · 护盾 %d · 连段 %d" % [
		int(data.get("level", 1)),
		int(data.get("gold", 0)),
		int(data.get("shield", 0)),
		int(data.get("combo_step", 0))
	]

func _on_lock_changed(target) -> void:
	if is_instance_valid(target):
		lock_label.text = "锁定：%s" % str(target.get("display_name"))
	else:
		lock_label.text = "未锁定目标"

func _on_announcement(message: String) -> void:
	announcement_label.text = message
	announcement_label.modulate.a = 1.0
	var tween: Tween = create_tween()
	tween.tween_interval(3.2)
	tween.tween_property(announcement_label, "modulate:a", 0.0, 0.8)

func _submit_incantation() -> void:
	if player == null:
		return
	var result: Dictionary = VoiceMagic.compile(voice_input.text)
	if bool(result.get("ok", false)):
		var spell: Dictionary = result.get("spell", {})
		voice_status.text = "识别：%s · LLM调用0" % str(spell.get("name", "未知法术"))
		if player.has_method("request_spell"):
			player.call("request_spell", str(result.get("spell_id", "")))
		close_voice_panel()
	else:
		voice_status.text = "无法识别：请使用元素＋形态＋行为词元。"

func _request_microphone() -> void:
	voice_status.text = "正在聆听……"
	VoiceMagic.request_microphone_recognition()

func _on_voice_result(text: String, spell_id: String, _confidence: float) -> void:
	voice_input.text = text
	var spell: Dictionary = VoiceMagic.SPELLS.get(spell_id, {})
	voice_status.text = "识别成功：%s" % str(spell.get("name", spell_id))
	if player != null and player.has_method("request_spell"):
		player.call("request_spell", spell_id)
	close_voice_panel()

func _on_voice_failed(reason: String) -> void:
	voice_status.text = reason

func _on_mobile_move(value: Vector2) -> void:
	if player != null and player.has_method("set_mobile_move_vector"):
		player.call("set_mobile_move_vector", value)

func _on_mobile_camera(relative: Vector2) -> void:
	if player != null and player.has_method("add_mobile_camera_delta"):
		player.call("add_mobile_camera_delta", relative)

func _on_mobile_action(action_name: String) -> void:
	if player == null:
		return
	match action_name:
		"attack":
			player.call("attack")
		"dodge":
			player.call("dodge")
		"jump":
			player.call("request_jump")
		"lock":
			player.call("toggle_lock")
		"interact":
			player.call("request_interaction")
		"voice":
			open_voice_panel()

func _on_mobile_spell(spell_id: String) -> void:
	if player != null and player.has_method("request_spell"):
		player.call("request_spell", spell_id)

func _build_ui() -> void:
	var root: Control = Control.new()
	root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(root)

	var stats: VBoxContainer = VBoxContainer.new()
	stats.position = Vector2(18, 18)
	stats.size = Vector2(430, 112)
	stats.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(stats)
	title_label = Label.new()
	title_label.add_theme_font_size_override("font_size", 20)
	stats.add_child(title_label)
	hp_bar = ProgressBar.new()
	hp_bar.show_percentage = false
	stats.add_child(hp_bar)
	mana_bar = ProgressBar.new()
	mana_bar.show_percentage = false
	stats.add_child(mana_bar)
	stamina_bar = ProgressBar.new()
	stamina_bar.show_percentage = false
	stats.add_child(stamina_bar)

	quest_label = Label.new()
	quest_label.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	quest_label.position = Vector2(-350, 24)
	quest_label.size = Vector2(330, 115)
	quest_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	quest_label.text = "主线：第一句咏唱\n前往法师公会旁寻找莱拉。"
	quest_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(quest_label)

	announcement_label = Label.new()
	announcement_label.set_anchors_preset(Control.PRESET_CENTER_TOP)
	announcement_label.position = Vector2(-360, 92)
	announcement_label.size = Vector2(720, 60)
	announcement_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	announcement_label.add_theme_font_size_override("font_size", 19)
	announcement_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(announcement_label)

	lock_label = Label.new()
	lock_label.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	lock_label.position = Vector2(-130, -112 if _mobile_device else -110)
	lock_label.size = Vector2(260, 30)
	lock_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	lock_label.text = "未锁定目标"
	lock_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(lock_label)

	debug_label = Label.new()
	debug_label.set_anchors_preset(Control.PRESET_BOTTOM_LEFT)
	debug_label.position = Vector2(18, -140 if _mobile_device else -140)
	debug_label.text = "Godot · FPS · LLM 0"
	debug_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(debug_label)

	help_label = Label.new()
	help_label.set_anchors_preset(Control.PRESET_BOTTOM_LEFT)
	help_label.position = Vector2(18, -72)
	help_label.text = (
		"左侧摇杆移动 · 右侧拖动镜头 · 右侧按钮战斗"
		if _mobile_device
		else "WASD移动 · Ctrl冲刺 · 空格跳跃 · 鼠标视角 · 左键/J三段剑击 · Shift闪避 · Tab锁定 · R咏唱 · E交互 · 1-5法术 · F5保存"
	)
	help_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(help_label)

	voice_panel = PanelContainer.new()
	voice_panel.set_anchors_preset(Control.PRESET_CENTER)
	voice_panel.position = Vector2(-260, -128)
	voice_panel.size = Vector2(520, 255)
	voice_panel.visible = false
	root.add_child(voice_panel)
	var voice_box: VBoxContainer = VBoxContainer.new()
	voice_panel.add_child(voice_box)
	var heading: Label = Label.new()
	heading.text = "声控咏唱"
	heading.add_theme_font_size_override("font_size", 25)
	voice_box.add_child(heading)
	voice_status = Label.new()
	voice_status.text = "Android原生版先使用文字咏唱；Web版可连接浏览器语音识别。"
	voice_box.add_child(voice_status)
	voice_input = LineEdit.new()
	voice_input.placeholder_text = "火焰 长枪 穿刺"
	voice_input.text_submitted.connect(func(_text): _submit_incantation())
	voice_box.add_child(voice_input)
	var buttons: HBoxContainer = HBoxContainer.new()
	voice_box.add_child(buttons)
	var microphone: Button = Button.new()
	microphone.text = "麦克风"
	microphone.pressed.connect(_request_microphone)
	buttons.add_child(microphone)
	var cast: Button = Button.new()
	cast.text = "释放"
	cast.pressed.connect(_submit_incantation)
	buttons.add_child(cast)
	var close: Button = Button.new()
	close.text = "返回战斗"
	close.pressed.connect(close_voice_panel)
	buttons.add_child(close)

	mobile_controls = MOBILE_CONTROLS_SCRIPT.new()
	root.add_child(mobile_controls)

func _is_mobile_device() -> bool:
	return (
		OS.has_feature("mobile")
		or OS.get_name() == "Android"
		or OS.get_name() == "iOS"
		or DisplayServer.is_touchscreen_available()
	)
