extends Control

signal move_changed(value: Vector2)
signal camera_dragged(relative: Vector2)
signal action_requested(action_name: String)
signal spell_requested(spell_id: String)

const JOYSTICK_RADIUS: float = 96.0
const KNOB_RADIUS: float = 38.0
const CAMERA_SENSITIVITY: float = 0.82

var enabled_for_device: bool = false
var _move_touch_id: int = -1
var _camera_touch_id: int = -1
var _move_origin: Vector2 = Vector2.ZERO
var _move_position: Vector2 = Vector2.ZERO
var _move_value: Vector2 = Vector2.ZERO
var _buttons: Array[Button] = []
var _hint_label: Label

func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	process_mode = Node.PROCESS_MODE_ALWAYS
	enabled_for_device = _is_mobile_device()
	visible = enabled_for_device
	if not enabled_for_device:
		return
	_build_buttons()
	_reset_joystick_to_default()
	set_process_input(true)
	queue_redraw()

func _notification(what: int) -> void:
	if what == NOTIFICATION_RESIZED and enabled_for_device:
		_reset_joystick_to_default(false)
		queue_redraw()

func set_enabled(value: bool) -> void:
	enabled_for_device = value
	visible = value
	set_process_input(value)
	if not value:
		_release_all_touches()
	queue_redraw()

func _input(event: InputEvent) -> void:
	if not enabled_for_device or not visible:
		return
	if event is InputEventScreenTouch:
		_handle_screen_touch(event)
	elif event is InputEventScreenDrag:
		_handle_screen_drag(event)

func _handle_screen_touch(event: InputEventScreenTouch) -> void:
	var touch_position: Vector2 = event.position
	if event.pressed:
		if _point_hits_button(touch_position):
			return
		if _is_move_zone(touch_position) and _move_touch_id == -1:
			_move_touch_id = event.index
			_move_origin = _clamp_joystick_origin(touch_position)
			_move_position = _move_origin
			_move_value = Vector2.ZERO
			move_changed.emit(_move_value)
			queue_redraw()
			get_viewport().set_input_as_handled()
			return
		if _camera_touch_id == -1:
			_camera_touch_id = event.index
			get_viewport().set_input_as_handled()
	else:
		if event.index == _move_touch_id:
			_move_touch_id = -1
			_move_value = Vector2.ZERO
			move_changed.emit(_move_value)
			_reset_joystick_to_default(false)
			queue_redraw()
			get_viewport().set_input_as_handled()
		elif event.index == _camera_touch_id:
			_camera_touch_id = -1
			get_viewport().set_input_as_handled()

func _handle_screen_drag(event: InputEventScreenDrag) -> void:
	if event.index == _move_touch_id:
		var offset: Vector2 = event.position - _move_origin
		if offset.length() > JOYSTICK_RADIUS:
			offset = offset.normalized() * JOYSTICK_RADIUS
		_move_position = _move_origin + offset
		_move_value = offset / JOYSTICK_RADIUS
		move_changed.emit(_move_value)
		queue_redraw()
		get_viewport().set_input_as_handled()
	elif event.index == _camera_touch_id:
		camera_dragged.emit(event.relative * CAMERA_SENSITIVITY)
		get_viewport().set_input_as_handled()

func _draw() -> void:
	if not enabled_for_device:
		return
	var base_color: Color = Color(0.06, 0.09, 0.14, 0.46)
	var ring_color: Color = Color(0.78, 0.88, 1.0, 0.42)
	var knob_color: Color = Color(0.35, 0.72, 1.0, 0.68)
	draw_circle(_move_origin, JOYSTICK_RADIUS, base_color)
	draw_arc(_move_origin, JOYSTICK_RADIUS, 0.0, TAU, 64, ring_color, 4.0, true)
	draw_circle(_move_position, KNOB_RADIUS, knob_color)
	draw_arc(_move_position, KNOB_RADIUS, 0.0, TAU, 40, Color.WHITE, 3.0, true)

func _build_buttons() -> void:
	_hint_label = Label.new()
	_hint_label.text = "左侧摇杆移动 · 右侧空白拖动镜头"
	_hint_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_hint_label.add_theme_font_size_override("font_size", 18)
	_hint_label.set_anchors_preset(Control.PRESET_CENTER_TOP)
	_hint_label.position = Vector2(-230, 8)
	_hint_label.size = Vector2(460, 34)
	_hint_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_hint_label)

	_add_action_button("攻击", Vector2(-158, -158), Vector2(118, 118), "attack", 28)
	_add_action_button("闪避", Vector2(-292, -126), Vector2(92, 92), "dodge", 20)
	_add_action_button("跳跃", Vector2(-158, -288), Vector2(92, 92), "jump", 20)
	_add_action_button("锁定", Vector2(-292, -246), Vector2(88, 78), "lock", 18)
	_add_action_button("交互", Vector2(-402, -132), Vector2(86, 74), "interact", 18)
	_add_action_button("咏唱", Vector2(-402, -238), Vector2(86, 74), "voice", 18)

	var spell_ids: Array[String] = [
		"fire_lance",
		"frost_aegis",
		"thunder_chain",
		"wind_step",
		"healing_light"
	]
	var spell_labels: Array[String] = ["火", "霜", "雷", "风", "愈"]
	for index in range(spell_ids.size()):
		var spell_button: Button = Button.new()
		spell_button.text = spell_labels[index]
		spell_button.add_theme_font_size_override("font_size", 17)
		spell_button.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
		spell_button.position = Vector2(-174 + index * 70, -72)
		spell_button.size = Vector2(60, 56)
		spell_button.focus_mode = Control.FOCUS_NONE
		spell_button.mouse_filter = Control.MOUSE_FILTER_STOP
		spell_button.pressed.connect(_on_spell_button.bind(spell_ids[index]))
		add_child(spell_button)
		_buttons.append(spell_button)

func _add_action_button(
	label_text: String,
	bottom_right_offset: Vector2,
	button_size: Vector2,
	action_name: String,
	font_size: int
) -> void:
	var button: Button = Button.new()
	button.text = label_text
	button.add_theme_font_size_override("font_size", font_size)
	button.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
	button.position = bottom_right_offset
	button.size = button_size
	button.focus_mode = Control.FOCUS_NONE
	button.mouse_filter = Control.MOUSE_FILTER_STOP
	button.pressed.connect(_on_action_button.bind(action_name))
	add_child(button)
	_buttons.append(button)

func _on_action_button(action_name: String) -> void:
	action_requested.emit(action_name)

func _on_spell_button(spell_id: String) -> void:
	spell_requested.emit(spell_id)

func _point_hits_button(point: Vector2) -> bool:
	for button in _buttons:
		if is_instance_valid(button) and button.get_global_rect().has_point(point):
			return true
	return false

func _is_move_zone(point: Vector2) -> bool:
	var viewport_size: Vector2 = get_viewport_rect().size
	return point.x <= viewport_size.x * 0.46 and point.y >= viewport_size.y * 0.28

func _clamp_joystick_origin(point: Vector2) -> Vector2:
	var viewport_size: Vector2 = get_viewport_rect().size
	return Vector2(
		clampf(point.x, JOYSTICK_RADIUS + 20.0, viewport_size.x * 0.46 - JOYSTICK_RADIUS * 0.25),
		clampf(point.y, viewport_size.y * 0.48, viewport_size.y - JOYSTICK_RADIUS - 18.0)
	)

func _reset_joystick_to_default(emit_zero: bool = true) -> void:
	var viewport_size: Vector2 = get_viewport_rect().size
	_move_origin = Vector2(132.0, maxf(140.0, viewport_size.y - 132.0))
	_move_position = _move_origin
	_move_value = Vector2.ZERO
	if emit_zero:
		move_changed.emit(_move_value)

func _release_all_touches() -> void:
	_move_touch_id = -1
	_camera_touch_id = -1
	_move_value = Vector2.ZERO
	move_changed.emit(_move_value)

func _is_mobile_device() -> bool:
	return (
		OS.has_feature("mobile")
		or OS.get_name() == "Android"
		or OS.get_name() == "iOS"
		or DisplayServer.is_touchscreen_available()
	)
