extends CharacterBody3D

signal stats_changed(data: Dictionary)
signal interaction_requested
signal voice_panel_requested
signal spell_cast(spell_id: String, origin: Vector3, direction: Vector3)
signal sword_attack(origin: Vector3, direction: Vector3, damage: float, combo_step: int)
signal lock_changed(target)

@export var walk_speed := 5.5
@export var sprint_speed := 8.5
@export var acceleration := 18.0
@export var gravity := 24.0
@export var jump_velocity := 8.5

var max_hp := 140.0
var hp := 140.0
var max_mana := 100.0
var mana := 100.0
var max_stamina := 100.0
var stamina := 100.0
var shield := 0.0
var level := 1
var gold := 40
var inventory: Dictionary = {"wood": 0, "iron": 0, "rune_dust": 0}
var focus_crafted := false
var cooldowns: Dictionary = {}
var attack_cooldown := 0.0
var combo_window := 0.0
var combo_step := 0
var dodge_cooldown := 0.0
var invulnerable := 0.0
var locked_target
var camera_yaw := 0.75
var camera_pitch := -0.28
var _camera_pivot: Node3D
var _camera: Camera3D
var _visual: Node3D

func _ready() -> void:
	add_to_group("player")
	_build_visual()
	_build_camera()
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	_emit_stats()

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
		camera_yaw -= event.relative.x * 0.004
		camera_pitch = clampf(camera_pitch - event.relative.y * 0.003, -0.9, 0.35)
	if event.is_action_pressed("ui_cancel"):
		if Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
			Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
		else:
			Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	if event.is_action_pressed("attack"):
		attack()
	if event.is_action_pressed("dodge"):
		dodge()
	if event.is_action_pressed("jump") and is_on_floor():
		velocity.y = jump_velocity
	if event.is_action_pressed("lock_target"):
		toggle_lock()
	if event.is_action_pressed("interact"):
		interaction_requested.emit()
	if event.is_action_pressed("voice_magic"):
		voice_panel_requested.emit()
	for index in range(1, 6):
		if event.is_action_pressed("spell_%d" % index):
			var spell_ids := ["fire_lance", "frost_aegis", "thunder_chain", "wind_step", "healing_light"]
			request_spell(spell_ids[index - 1])

func _physics_process(delta: float) -> void:
	attack_cooldown = maxf(0.0, attack_cooldown - delta)
	combo_window = maxf(0.0, combo_window - delta)
	if combo_window <= 0.0:
		combo_step = 0
	dodge_cooldown = maxf(0.0, dodge_cooldown - delta)
	invulnerable = maxf(0.0, invulnerable - delta)
	mana = minf(max_mana, mana + 5.0 * delta)
	stamina = minf(max_stamina, stamina + 15.0 * delta)
	for key in cooldowns.keys():
		cooldowns[key] = maxf(0.0, float(cooldowns[key]) - delta)
	if not is_on_floor():
		velocity.y -= gravity * delta
	var input_vector := Input.get_vector("move_left", "move_right", "move_forward", "move_back")
	var camera_basis := Basis(Vector3.UP, camera_yaw)
	var direction := (camera_basis * Vector3(input_vector.x, 0.0, input_vector.y)).normalized()
	var sprinting := Input.is_key_pressed(KEY_CTRL) and stamina > 0.0 and direction.length() > 0.05
	var target_speed := sprint_speed if sprinting else walk_speed
	velocity.x = move_toward(velocity.x, direction.x * target_speed, acceleration * delta)
	velocity.z = move_toward(velocity.z, direction.z * target_speed, acceleration * delta)
	if direction.length() > 0.05:
		rotation.y = lerp_angle(rotation.y, atan2(direction.x, direction.z), 12.0 * delta)
		if sprinting:
			stamina = maxf(0.0, stamina - 13.0 * delta)
	_update_camera(delta)
	move_and_slide()
	_emit_stats()

func attack() -> void:
	if attack_cooldown > 0.0 or stamina < 10.0:
		return
	combo_step = 1 if combo_window <= 0.0 else (combo_step % 3) + 1
	combo_window = 0.72
	attack_cooldown = [0.0, 0.34, 0.38, 0.54][combo_step]
	var stamina_cost := [0.0, 10.0, 12.0, 18.0][combo_step]
	var damage_scale := [0.0, 1.0, 1.18, 1.62][combo_step]
	stamina -= stamina_cost
	var metrics: Dictionary = WorldState.state.get("metrics", {})
	metrics["sword_swings"] = int(metrics.get("sword_swings", 0)) + 1
	WorldState.state["metrics"] = metrics
	sword_attack.emit(global_position + Vector3.UP, aim_direction(), (30.0 + level * 4.0) * damage_scale, combo_step)
	_animate_attack(combo_step)

func dodge() -> void:
	if dodge_cooldown > 0.0 or stamina < 24.0:
		return
	dodge_cooldown = 0.8
	invulnerable = 0.42
	stamina -= 24.0
	var input_vector := Input.get_vector("move_left", "move_right", "move_forward", "move_back")
	var direction := aim_direction()
	if input_vector.length() > 0.05:
		var camera_basis := Basis(Vector3.UP, camera_yaw)
		direction = (camera_basis * Vector3(input_vector.x, 0.0, input_vector.y)).normalized()
	velocity.x = direction.x * 14.0
	velocity.z = direction.z * 14.0

func request_spell(spell_id: String) -> void:
	if not VoiceMagic.SPELLS.has(spell_id):
		return
	var spell: Dictionary = VoiceMagic.SPELLS[spell_id]
	var mana_cost := float(spell.get("mana", 0.0))
	if float(cooldowns.get(spell_id, 0.0)) > 0.0 or mana < mana_cost:
		return
	mana -= mana_cost
	cooldowns[spell_id] = float(spell.get("cooldown", 0.0))
	var metrics: Dictionary = WorldState.state.get("metrics", {})
	metrics["voice_casts"] = int(metrics.get("voice_casts", 0)) + 1
	WorldState.state["metrics"] = metrics
	spell_cast.emit(spell_id, global_position + Vector3.UP * 1.3, aim_direction())

func aim_direction() -> Vector3:
	if is_instance_valid(locked_target):
		return (locked_target.global_position - global_position).normalized()
	return -global_transform.basis.z

func toggle_lock() -> void:
	if is_instance_valid(locked_target):
		locked_target = null
	else:
		var nearest = null
		var best := 28.0
		for candidate in get_tree().get_nodes_in_group("enemy"):
			if not is_instance_valid(candidate):
				continue
			var distance := global_position.distance_to(candidate.global_position)
			if distance < best:
				best = distance
				nearest = candidate
		locked_target = nearest
	lock_changed.emit(locked_target)

func take_damage(amount: float) -> void:
	if invulnerable > 0.0:
		return
	var blocked := minf(shield, amount)
	shield -= blocked
	hp -= amount - blocked
	if hp <= 0.0:
		hp = max_hp
		mana = max_mana
		stamina = max_stamina
		global_position = Vector3(20, 1, 19)
		WorldState.announce("【复苏】你在灰烬边境重新苏醒。")
	_emit_stats()

func add_loot(kind: String, amount := 1) -> void:
	inventory[kind] = int(inventory.get(kind, 0)) + amount
	_emit_stats()

func serialize() -> Dictionary:
	return {
		"position": [global_position.x, global_position.y, global_position.z],
		"hp": hp,
		"mana": mana,
		"stamina": stamina,
		"level": level,
		"gold": gold,
		"inventory": inventory,
		"focus_crafted": focus_crafted
	}

func restore(data: Dictionary) -> void:
	var position_data = data.get("position", [])
	if position_data is Array and position_data.size() == 3:
		global_position = Vector3(float(position_data[0]), float(position_data[1]), float(position_data[2]))
	hp = float(data.get("hp", hp))
	mana = float(data.get("mana", mana))
	stamina = float(data.get("stamina", stamina))
	level = int(data.get("level", level))
	gold = int(data.get("gold", gold))
	var restored_inventory = data.get("inventory", inventory)
	if restored_inventory is Dictionary:
		inventory = restored_inventory
	focus_crafted = bool(data.get("focus_crafted", false))
	_emit_stats()

func _build_visual() -> void:
	_visual = Node3D.new()
	_visual.name = "Visual"
	add_child(_visual)
	_add_mesh(_visual, BoxMesh.new(), Vector3(0, 1.25, 0), Vector3(0.72, 1.25, 0.48), Color("347bd0"))
	_add_mesh(_visual, SphereMesh.new(), Vector3(0, 2.25, 0), Vector3(0.48, 0.48, 0.48), Color("d4a578"))
	_add_mesh(_visual, BoxMesh.new(), Vector3(0.66, 1.4, 0), Vector3(0.08, 1.45, 0.08), Color("aeb9ca"))
	var collision := CollisionShape3D.new()
	var capsule := CapsuleShape3D.new()
	capsule.radius = 0.48
	capsule.height = 2.0
	collision.shape = capsule
	collision.position.y = 1.0
	add_child(collision)

func _build_camera() -> void:
	_camera_pivot = Node3D.new()
	_camera_pivot.name = "CameraPivot"
	add_child(_camera_pivot)
	var spring := SpringArm3D.new()
	spring.name = "SpringArm"
	spring.spring_length = 9.0
	spring.collision_mask = 1
	spring.margin = 0.18
	_camera_pivot.add_child(spring)
	_camera = Camera3D.new()
	_camera.current = true
	_camera.fov = 68.0
	spring.add_child(_camera)

func _update_camera(delta: float) -> void:
	_camera_pivot.global_position = global_position + Vector3.UP * 1.55
	if is_instance_valid(locked_target):
		var target_direction := locked_target.global_position - global_position
		var desired_yaw := atan2(target_direction.x, target_direction.z) + PI
		camera_yaw = lerp_angle(camera_yaw, desired_yaw, minf(1.0, 5.5 * delta))
	_camera_pivot.rotation = Vector3(camera_pitch, camera_yaw, 0.0)

func _animate_attack(step: int) -> void:
	if _visual == null:
		return
	var angle := [-0.0, -0.62, 0.78, -1.05][step]
	var tween := create_tween()
	tween.tween_property(_visual, "rotation:y", angle, 0.1)
	tween.tween_property(_visual, "rotation:y", 0.0, 0.16 if step < 3 else 0.28)

func _add_mesh(parent: Node3D, mesh: PrimitiveMesh, position: Vector3, scale_value: Vector3, color: Color) -> MeshInstance3D:
	var instance := MeshInstance3D.new()
	instance.mesh = mesh
	instance.position = position
	instance.scale = scale_value
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.roughness = 0.78
	instance.material_override = material
	parent.add_child(instance)
	return instance

func _emit_stats() -> void:
	stats_changed.emit({
		"hp": hp,
		"max_hp": max_hp,
		"mana": mana,
		"max_mana": max_mana,
		"stamina": stamina,
		"max_stamina": max_stamina,
		"shield": shield,
		"level": level,
		"gold": gold,
		"inventory": inventory,
		"focus_crafted": focus_crafted,
		"combo_step": combo_step
	})
