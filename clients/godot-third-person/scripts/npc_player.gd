extends CharacterBody3D

var display_name := "冒险者"
var guild_name := "无名旅团"
var role := "剑士"
var level := 3
var target_position := Vector3.ZERO
var move_speed := 2.0
var _rng := RandomNumberGenerator.new()

func configure(index: int, name_value: String, color: Color) -> void:
	display_name = name_value
	guild_name = ["灰烬远征团", "星纹学院", "白鸦商会", "无名旅团"][index % 4]
	role = ["剑士", "法师", "游侠", "神官"][index % 4]
	level = 2 + index % 12
	_rng.seed = index * 113 + 17
	_build_visual(color)

func _ready() -> void:
	add_to_group("npc_player")
	_choose_target()

func _physics_process(delta: float) -> void:
	var direction := target_position - global_position
	direction.y = 0.0
	if direction.length() < 1.0:
		_choose_target()
	else:
		direction = direction.normalized()
		velocity.x = direction.x * move_speed
		velocity.z = direction.z * move_speed
		rotation.y = lerp_angle(rotation.y, atan2(direction.x, direction.z), 5.0 * delta)
	if not is_on_floor():
		velocity.y -= 24.0 * delta
	move_and_slide()

func _choose_target() -> void:
	target_position = Vector3(_rng.randf_range(6.0, 104.0), 1.0, _rng.randf_range(6.0, 104.0))

func _build_visual(color: Color) -> void:
	var body := MeshInstance3D.new()
	var box := BoxMesh.new()
	body.mesh = box
	body.position.y = 1.1
	body.scale = Vector3(0.55, 1.05, 0.4)
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.roughness = 0.8
	body.material_override = material
	add_child(body)
	var head := MeshInstance3D.new()
	head.mesh = SphereMesh.new()
	head.position.y = 2.05
	head.scale = Vector3.ONE * 0.42
	var skin := StandardMaterial3D.new()
	skin.albedo_color = Color("d4a578")
	head.material_override = skin
	add_child(head)
	var collision := CollisionShape3D.new()
	var shape := CapsuleShape3D.new()
	shape.radius = 0.42
	shape.height = 1.8
	collision.shape = shape
	collision.position.y = 0.95
	add_child(collision)
	var label := Label3D.new()
	label.text = "%s · %s Lv.%d\n[%s]" % [display_name, role, level, guild_name]
	label.position = Vector3(0, 2.8, 0)
	label.font_size = 20
	label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	label.no_depth_test = true
	add_child(label)
