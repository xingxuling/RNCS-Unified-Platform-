extends Node

const GAME_SCENE_PATH := "res://scenes/GameWorld.tscn"
const LOG_PATH := "user://startup_diagnostics.log"

var _status_label: Label
var _details_label: Label

func _ready() -> void:
	_build_diagnostic_screen()
	_write_log("Bootstrap started with Godot %s" % Engine.get_version_info().get("string", "unknown"))
	call_deferred("_launch_game")

func _build_diagnostic_screen() -> void:
	var layer := CanvasLayer.new()
	add_child(layer)
	var background := ColorRect.new()
	background.color = Color(0.035, 0.045, 0.065, 1.0)
	background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	layer.add_child(background)
	var box := VBoxContainer.new()
	box.position = Vector2(48, 48)
	box.size = Vector2(900, 400)
	background.add_child(box)
	var title := Label.new()
	title.text = "灰烬边境 · Godot 启动诊断"
	title.add_theme_font_size_override("font_size", 30)
	box.add_child(title)
	_status_label = Label.new()
	_status_label.text = "正在加载第三人称世界……"
	_status_label.add_theme_font_size_override("font_size", 20)
	box.add_child(_status_label)
	_details_label = Label.new()
	_details_label.text = "若核心场景加载失败，本窗口会保留错误提示，不再闪退。"
	_details_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_details_label.custom_minimum_size = Vector2(850, 150)
	box.add_child(_details_label)

func _launch_game() -> void:
	var packed = ResourceLoader.load(GAME_SCENE_PATH, "PackedScene", ResourceLoader.CACHE_MODE_REPLACE)
	if packed == null or not (packed is PackedScene):
		_show_failure("无法加载 %s。请查看 Godot 编辑器 Output，以及 %s。" % [GAME_SCENE_PATH, LOG_PATH])
		return
	var game = packed.instantiate()
	if game == null:
		_show_failure("GameWorld.tscn 已读取，但实例化失败。")
		return
	add_child(game)
	if game.has_method("run_startup_self_test"):
		var report = game.call("run_startup_self_test")
		if report is Dictionary and not bool(report.get("ok", false)):
			_show_failure("启动自检失败：%s" % JSON.stringify(report))
			return
	_status_label.text = "启动成功"
	_details_label.text = "第三人称世界已加载。WASD移动，空格跳跃，左键/J三段剑击，Shift闪避，Tab锁定，R咏唱。"
	_write_log("GameWorld loaded successfully")
	await get_tree().create_timer(1.2).timeout
	if is_instance_valid(_status_label):
		_status_label.get_parent().get_parent().get_parent().visible = false

func _show_failure(message: String) -> void:
	_status_label.text = "启动失败，但诊断窗口已保留"
	_details_label.text = message
	_write_log("ERROR: %s" % message)
	push_error(message)

func _write_log(message: String) -> void:
	var file := FileAccess.open(LOG_PATH, FileAccess.READ_WRITE)
	if file == null:
		file = FileAccess.open(LOG_PATH, FileAccess.WRITE)
	if file == null:
		return
	file.seek_end()
	file.store_line("[%s] %s" % [Time.get_datetime_string_from_system(), message])
