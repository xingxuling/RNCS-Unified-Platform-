extends CharacterBody3D
class_name FrontierEnemy

signal defeated(enemy, enemy_type: String)

var enemy_type := "imp"
var display_name := "灰烬小鬼"
var max_hp := 70.0
var hp := 70.0
var damage := 9.0
var speed := 3.0
var attack_range := 2.0
var aggro_range := 20.0
var attack_cooldown := 0.0
var boss := false
var phase := 1
var target: PlayerController
var _nameplate: Label3D

func configure(kind: String) -> void:
	enemy_type = kind
	var table = {
		"imp": {"name": "灰烬小鬼", "hp": 70.0, "damage": 9.0, "speed": 3.0, "color": Color("cf3d20")},
		"wolf": {"name": "苔原猎狼", "hp": 110.0, "damage": 13.0, "speed": 4.0, "color": Color("52705a")},
		"sentinel": {"name": "遗迹哨兵", "hp": 170.0, "damage": 18.0, "speed": 2.5, "color": Color("6b738b")},
		"boss": {"name": "熔心守卫", "hp": 980.0, "damage": 28.0, "speed": 2.6, "color": Color("b92513")}
	}
	var data: Dictionary = table.get(kind, table["imp"])
	display_name = str(data.get("name", "灰烬小鬼"))
	max_hp = float(data.get("hp", 70.0))
	hp = max_hp
	damage = float(data.get("damage", 9.0))
	speed = float(data.get("speed", 3.0))
	boss = kind == "boss"
	aggro_range = 42.0 if boss else 20.0
	attack_range = 3.8 if boss else 2.2
	_build_visual(data.get("color", Color.WHITE))

func _ready() -> void:
	add_to_group("enemy")
	target = get_tree().get_first_node_in_group("player") as PlayerController
	_update_nameplate()

func _physics_process(delta: float) -> void:
	attack_cooldown = maxf(0.0, attack_cooldown - delta)
	if not is_instance_valid(target):
		target = get_tree().get_first_node_in_group("player") as PlayerController
		return
	if boss:
		phase = 3 if hp < max_hp * 0.33 else (2 if hp < max_hp * 0.66 else 1)
	var distance: float = global_position.distance_to(target.global_position)
	if distance < aggro_range and distance > attack_range:
		var direction: Vector3 = (target.global_position - global_position).normalized()
		velocity.x = direction.x * speed
		velocity.z = direction.z * speed
		rotation.y = lerp_angle(rotation.y, atan2(direction.x, direction.z), 8.0 * delta)
	else:
		velocity.x = move_toward(velocity.x, 0.0, 10.0 * delta)
		velocity.z = move_toward(velocity.z, 0.0, 10.0 * delta)
	if distance <= attack_range and attack_cooldown <= 0.0:
		attack_cooldown = maxf(0.75, 1.7 - phase * 0.22) if boss else 1.4
		if target.has_method("take_damage"):
			var dealt: float = damage * (0.7 + phase * 0.18) if boss else damage
			target.call("take_damage", dealt)
	if not is_on_floor():
		velocity.y -= 24.0 * delta
	move_and_slide()

func take_damage(amount: float) -> void:
	hp -= amount
	_flash()
	_update_nameplate()
	if hp <= 0.0:
		defeated.emit(self, enemy_type)
		queue_free()

func apply_knockback(direction: Vector3, force: float) -> void:
	velocity.x += direction.x * force
	velocity.z += direction.z * force

func _build_visual(color: Color) -> void:
	var scale_factor = 2.4 if boss else (1.35 if enemy_type == "sentinel" else 0.9)
	var mesh = MeshInstance3D.new()
	var capsule = CapsuleMesh.new()
	capsule.radius = 0.55
	capsule.height = 1.6
	mesh.mesh = capsule
	mesh.position.y = scale_factor
	mesh.scale = Vector3.ONE * scale_factor
	var material = StandardMaterial3D.new()
	material.albedo_color = color
	material.metallic = 0.3 if enemy_type == "sentinel" else 0.0
	material.roughness = 0.65
	mesh.material_override = material
	add_child(mesh)
	var collision = CollisionShape3D.new()
	var shape = CapsuleShape3D.new()
	shape.radius = 0.55 * scale_factor
	shape.height = 1.6 * scale_factor
	collision.shape = shape
	collision.position.y = scale_factor
	add_child(collision)
	_nameplate = Label3D.new()
	_nameplate.position = Vector3(0, scale_factor * 2.2, 0)
	_nameplate.font_size = 34 if boss else 24
	_nameplate.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	_nameplate.no_depth_test = true
	add_child(_nameplate)

func _update_nameplate() -> void:
	if _nameplate != null:
		_nameplate.text = "%s  %d/%d" % [display_name, maxi(0, int(hp)), int(max_hp)]

func _flash() -> void:
	var tween = create_tween()
	tween.tween_property(self, "scale", Vector3.ONE * 1.12, 0.05)
	tween.tween_property(self, "scale", Vector3.ONE, 0.1)
