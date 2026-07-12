extends Node

const GAME_SCENE_PATH := "res://scenes/GameWorld.tscn"
const LOG_PATH := "user://startup_diagnostics.log"
const SCENE_LOAD_TIMEOUT_MS := 15000
const WORLD_READY_TIMEOUT_MS := 30000

var _diagnostic_layer: CanvasLayer
var _status_label: Label
var _details_label: Label
var _progress_bar: ProgressBar
var _game_ready := false
var _game_failed := false
var _failure_message := ""

func _ready() -> void:
	_build_diagnostic_screen()
	_write_log(
		"Bootstrap started with Godot %s" %
		Engine.get_version_info().get("string", "unknown")
	)
	await get_tree().process_frame
	await _launch_game()

func _build_diagnostic_screen() -> void:
	_diagnostic_layer = CanvasLayer.new()
	_diagnostic_layer.layer = 100
	add_child(_diagnostic_layer)

	var background = ColorRect.new()
	background.color = Color(0.035, 0.045, 0.065, 1.0)
	background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_diagnostic_layer.add_child(background)

	var box = VBoxContainer.new()
	box.position = Vector2(48, 48)
	box.size = Vector2(900, 430)
	background.add_child(box)

	var title = Label.new()
	title.text = "灰烬边境 · Godot 启动诊断"
	title.add_theme_font_size_override("font_size", 30)
	box.add_child(title)

	_status_label = Label.new()
	_status_label.text = "正在准备第三人称世界……"
	_status_label.add_theme_font_size_override("font_size", 20)
	box.add_child(_status_label)

	_progress_bar = ProgressBar.new()
	_progress_bar.min_value = 0.0
	_progress_bar.max_value = 100.0
	_progress_bar.value = 1.0
	_progress_bar.custom_minimum_size = Vector2(850, 24)
	box.add_child(_progress_bar)

	_details_label = Label.new()
	_details_label.text = "世界会分阶段加载；出生区域完成后立即进入游戏。"
	_details_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_details_label.custom_minimum_size = Vector2(850, 170)
	box.add_child(_details_label)

func _launch_game() -> void:
	if not ResourceLoader.exists(GAME_SCENE_PATH, "PackedScene"):
		_show_failure("找不到核心场景：%s" % GAME_SCENE_PATH)
		return

	_status_label.text = "正在读取核心场景……"
	_progress_bar.value = 4.0
	var request_error = ResourceLoader.load_threaded_request(
		GAME_SCENE_PATH,
		"PackedScene"
	)
	if request_error != OK:
		_show_failure(
			"异步场景读取请求失败，错误码：%d" % request_error
		)
		return

	var scene_started = Time.get_ticks_msec()
	while true:
		var progress: Array = []
		var status = ResourceLoader.load_threaded_get_status(
			GAME_SCENE_PATH,
			progress
		)
		if status == ResourceLoader.THREAD_LOAD_LOADED:
			break
		if status == ResourceLoader.THREAD_LOAD_FAILED:
			_show_failure("GameWorld.tscn 读取失败。")
			return
		if status == ResourceLoader.THREAD_LOAD_INVALID_RESOURCE:
			_show_failure("GameWorld.tscn 不是有效资源。")
			return
		if Time.get_ticks_msec() - scene_started > SCENE_LOAD_TIMEOUT_MS:
			_show_failure("核心场景读取超过15秒，已停止等待。")
			return
		if not progress.is_empty():
			_progress_bar.value = 4.0 + float(progress[0]) * 16.0
		await get_tree().process_frame

	var packed = ResourceLoader.load_threaded_get(GAME_SCENE_PATH)
	if packed == null or not (packed is PackedScene):
		_show_failure("核心场景已读取，但不是 PackedScene。")
		return

	var game = packed.instantiate()
	if game == null:
		_show_failure("GameWorld.tscn 实例化失败。")
		return

	if game.has_signal("initialization_progress"):
		game.connect(
			"initialization_progress",
			Callable(self, "_on_initialization_progress")
		)
	if game.has_signal("world_ready"):
		game.connect("world_ready", Callable(self, "_on_world_ready"))
	if game.has_signal("world_failed"):
		game.connect("world_failed", Callable(self, "_on_world_failed"))

	_status_label.text = "正在创建出生区域……"
	_progress_bar.value = 20.0
	add_child(game)

	var world_started = Time.get_ticks_msec()
	while not _game_ready and not _game_failed:
		if Time.get_ticks_msec() - world_started > WORLD_READY_TIMEOUT_MS:
			_show_failure(
				"世界初始化超过30秒。请查看编辑器 Output 与 %s。" %
				LOG_PATH
			)
			return
		await get_tree().process_frame

	if _game_failed:
		_show_failure(_failure_message)

func _on_initialization_progress(
	stage: String,
	progress: float,
	detail: String
) -> void:
	_status_label.text = stage
	_progress_bar.value = clampf(progress, 20.0, 99.0)
	_details_label.text = detail
	_write_log("PROGRESS %.1f%% %s - %s" % [progress, stage, detail])

func _on_world_ready(report: Dictionary) -> void:
	_game_ready = true
	_status_label.text = "启动成功"
	_progress_bar.value = 100.0
	_details_label.text = (
		"第三人称世界已加载。WASD移动，空格跳跃，"
		+ "左键/J三段剑击，Shift闪避，Tab锁定，R咏唱。\n"
		+ "启动报告：%s" % JSON.stringify(report)
	)
	_write_log("GameWorld ready: %s" % JSON.stringify(report))
	await get_tree().create_timer(0.8).timeout
	if is_instance_valid(_diagnostic_layer):
		_diagnostic_layer.visible = false

func _on_world_failed(message: String) -> void:
	_game_failed = true
	_failure_message = message

func _show_failure(message: String) -> void:
	_game_failed = true
	_failure_message = message
	_status_label.text = "启动失败，但诊断窗口已保留"
	_progress_bar.value = 0.0
	_details_label.text = (
		message
		+ "\n日志："
		+ LOG_PATH
		+ "\n可在编辑器底部 Output 查看首个红色错误。"
	)
	_write_log("ERROR: %s" % message)
	push_error(message)

func _write_log(message: String) -> void:
	var file = FileAccess.open(LOG_PATH, FileAccess.READ_WRITE)
	if file == null:
		file = FileAccess.open(LOG_PATH, FileAccess.WRITE)
	if file == null:
		return
	file.seek_end()
	file.store_line(
		"[%s] %s" % [Time.get_datetime_string_from_system(), message]
	)
