extends Node3D

const PLAYER_SCRIPT = preload("res://scripts/player_controller.gd")
const ENEMY_SCRIPT = preload("res://scripts/enemy.gd")
const NPC_PLAYER_SCRIPT = preload("res://scripts/npc_player.gd")

var player
var hud
var enemies_alive := 0
var imp_kills := 0
var quest_stage := 0
var world_time := 0.18
var _projectiles: Array[Dictionary] = []

func _ready() -> void:
	hud = $HUD
	_build_world()
	_spawn_player()
	_spawn_enemies()
	_spawn_npc_players()
	var loaded := WorldState.load_world()
	if loaded.has("player") and player != null and player.has_method("restore"):
		player.call("restore", loaded.get("player", {}))
	WorldState.announce("【世界公告】灰烬边境 Season 0 第三人称世界已开启。")

func _process(delta: float) -> void:
	_tick_projectiles(delta)
	_update_day_cycle(delta)
	if Input.is_action_just_pressed("save_world") and player != null:
		WorldState.save_world(player.call("serialize"))

func run_startup_self_test() -> Dictionary:
	var errors: Array[String] = []
	if player == null:
		errors.append("PLAYER_NOT_CREATED")
	if hud == null:
		errors.append("HUD_NOT_FOUND")
	if get_tree().get_nodes_in_group("enemy").size() != 14:
		errors.append("ENEMY_COUNT_MISMATCH")
	if get_tree().get_nodes_in_group("npc_player").size() != 16:
		errors.append("NPC_PLAYER_COUNT_MISMATCH")
	return {
		"ok": errors.is_empty(),
		"errors": errors,
		"player": player != null,
		"enemies": get_tree().get_nodes_in_group("enemy").size(),
		"npc_players": get_tree().get_nodes_in_group("npc_player").size()
	}

func _spawn_player() -> void:
	player = PLAYER_SCRIPT.new()
	player.name = "Player"
	player.global_position = Vector3(20, 1, 19)
	player.connect("sword_attack", Callable(self, "_on_sword_attack"))
	player.connect("spell_cast", Callable(self, "_on_spell_cast"))
	player.connect("interaction_requested", Callable(self, "_on_interaction"))
	add_child(player)
	hud.call("bind_player", player)

func _spawn_enemies() -> void:
	var specs := [
		["imp", Vector3(32, 1, 24)], ["imp", Vector3(38, 1, 20)], ["imp", Vector3(43, 1, 29)],
		["imp", Vector3(48, 1, 18)], ["imp", Vector3(51, 1, 34)], ["imp", Vector3(57, 1, 27)],
		["wolf", Vector3(58, 1, 49)], ["wolf", Vector3(65, 1, 44)], ["wolf", Vector3(69, 1, 56)],
		["wolf", Vector3(75, 1, 46)], ["sentinel", Vector3(82, 1, 67)], ["sentinel", Vector3(87, 1, 74)],
		["sentinel", Vector3(91, 1, 63)], ["boss", Vector3(96, 1, 88)]
	]
	for spec in specs:
		var enemy = ENEMY_SCRIPT.new()
		enemy.call("configure", str(spec[0]))
		enemy.global_position = spec[1]
		enemy.connect("defeated", Callable(self, "_on_enemy_defeated"))
		add_child(enemy)
		enemies_alive += 1

func _spawn_npc_players() -> void:
	var names := ["夜雨", "白鸦", "铸星者", "风铃旅者", "霜枝", "赤砂", "星轨", "无声剑", "青穹", "旧梦", "炉心", "月湾", "影鹿", "渡火", "银槲", "静雷"]
	var colors := [Color("58b7ff"), Color("d98cff"), Color("ffad44"), Color("61e7a7")]
	for index in range(names.size()):
		var npc = NPC_PLAYER_SCRIPT.new()
		npc.call("configure", index, names[index], colors[index % colors.size()])
		npc.global_position = Vector3(8 + (index * 17) % 86, 1, 10 + (index * 29) % 84)
		add_child(npc)

func _on_sword_attack(origin: Vector3, direction: Vector3, damage: float, combo_step: int) -> void:
	for enemy in get_tree().get_nodes_in_group("enemy"):
		if not is_instance_valid(enemy):
			continue
		if origin.distance_to(enemy.global_position) <= 3.5 + combo_step * 0.15:
			var to_enemy := (enemy.global_position - origin).normalized()
			if to_enemy.dot(direction.normalized()) > 0.05:
				enemy.call("take_damage", damage)
				if enemy.has_method("apply_knockback"):
					enemy.call("apply_knockback", direction, 1.5 + combo_step)

func _on_spell_cast(spell_id: String, origin: Vector3, direction: Vector3) -> void:
	match spell_id:
		"fire_lance":
			_projectiles.append({
				"position": origin,
				"velocity": direction.normalized() * 22.0,
				"ttl": 1.8,
				"damage": 48.0,
				"node": _make_effect(origin, Color("ff4b14"), 0.32)
			})
		"frost_aegis":
			player.shield = maxf(float(player.shield), 60.0)
			_make_effect(player.global_position + Vector3.UP, Color("55cfff"), 1.2, 0.55)
		"thunder_chain":
			var candidates := get_tree().get_nodes_in_group("enemy")
			candidates.sort_custom(func(a, b): return player.global_position.distance_to(a.global_position) < player.global_position.distance_to(b.global_position))
			for enemy in candidates.slice(0, 3):
				if player.global_position.distance_to(enemy.global_position) < 18.0:
					enemy.call("take_damage", 35.0)
					_make_effect(enemy.global_position + Vector3.UP, Color("ad6cff"), 0.7, 0.35)
		"wind_step":
			player.global_position += player.call("aim_direction") * 8.0
			player.invulnerable = 0.3
		"healing_light":
			player.hp = minf(float(player.max_hp), float(player.hp) + 50.0)
			_make_effect(player.global_position + Vector3.UP, Color("ffe463"), 1.0, 0.45)

func _tick_projectiles(delta: float) -> void:
	for projectile in _projectiles:
		projectile["position"] = projectile.get("position", Vector3.ZERO) + projectile.get("velocity", Vector3.ZERO) * delta
		projectile["ttl"] = float(projectile.get("ttl", 0.0)) - delta
		var node = projectile.get("node")
		if is_instance_valid(node):
			node.global_position = projectile["position"]
		for enemy in get_tree().get_nodes_in_group("enemy"):
			if not is_instance_valid(enemy):
				continue
			if projectile["position"].distance_to(enemy.global_position + Vector3.UP) < 1.7:
				enemy.call("take_damage", float(projectile.get("damage", 0.0)))
				projectile["ttl"] = 0.0
				break
	for index in range(_projectiles.size() - 1, -1, -1):
		if float(_projectiles[index].get("ttl", 0.0)) <= 0.0:
			var node = _projectiles[index].get("node")
			if is_instance_valid(node):
				node.queue_free()
			_projectiles.remove_at(index)

func _on_enemy_defeated(_enemy, kind: String) -> void:
	enemies_alive -= 1
	match kind:
		"imp":
			player.call("add_loot", "rune_dust")
			imp_kills += 1
		"wolf":
			player.call("add_loot", "wood")
		"sentinel":
			player.call("add_loot", "iron")
		"boss":
			WorldState.state["boss_defeated"] = true
			WorldState.state["next_region_open"] = true
			WorldState.announce("【首杀公告】咏唱者击败熔心守卫，浮空学院航道已登记。")
	if imp_kills >= 3 and quest_stage < 2:
		quest_stage = 2
		hud.call("update_quest", "主线：魔导器的骨架\n收集灰烬木2、陨铁2、符文尘3，返回赤铁锻坊。")

func _on_interaction() -> void:
	if player.global_position.distance_to(Vector3(15, 1, 18)) < 6.0 and quest_stage == 0:
		quest_stage = 1
		hud.call("update_quest", "主线：灰烬试炼\n在城外击败3只灰烬小鬼。")
		WorldState.announce("【系统】你学会了第一句咏唱：火焰·长枪·穿刺。")
		return
	if player.global_position.distance_to(Vector3(30, 1, 14)) < 7.0 and not bool(player.focus_crafted):
		var inventory: Dictionary = player.inventory
		if int(inventory.get("wood", 0)) >= 2 and int(inventory.get("iron", 0)) >= 2 and int(inventory.get("rune_dust", 0)) >= 3:
			inventory["wood"] = int(inventory.get("wood", 0)) - 2
			inventory["iron"] = int(inventory.get("iron", 0)) - 2
			inventory["rune_dust"] = int(inventory.get("rune_dust", 0)) - 3
			player.inventory = inventory
			player.focus_crafted = true
			WorldState.state["ruins_open"] = true
			hud.call("update_quest", "主线：封锁遗迹\n前往东北方遗迹，挑战熔心守卫。")
			WorldState.announce("【制造公告】初阶魔导器完成，封锁遗迹已解禁。")
		else:
			WorldState.announce("【锻坊】需要灰烬木2、陨铁2、符文尘3。")

func _build_world() -> void:
	_make_static_box(Vector3(55, -0.5, 55), Vector3(112, 1, 112), Color("344f3b"), "Ground")
	_make_static_box(Vector3(24, 0.02, 21), Vector3(42, 0.08, 7), Color("5b5144"), "TownRoad")
	_make_static_box(Vector3(56, 0.02, 55), Vector3(78, 0.08, 5), Color("5b5144"), "FrontierRoad")
	var buildings := [
		[Vector3(8, 3.5, 8), Vector3(14, 7, 12), Color("465780")],
		[Vector3(25, 2.5, 8), Vector3(11, 5, 10), Color("7b4930")],
		[Vector3(8, 2.5, 27), Vector3(13, 5, 11), Color("6a4d35")],
		[Vector3(28, 4, 25), Vector3(15, 8, 13), Color("4c5666")]
	]
	for building in buildings:
		_make_static_box(building[0], building[1], building[2], "Building")
	for index in range(90):
		var x := 5.0 + float((index * 37) % 101)
		var z := 5.0 + float((index * 61) % 101)
		if (x < 46 and z < 43) or (x > 90 and z > 78):
			continue
		_make_tree(Vector3(x, 0, z), 0.7 + float(index % 7) * 0.12, x > 50)
	for index in range(48):
		var x := 28.0 + float((index * 23) % 75)
		var z := 8.0 + float((index * 47) % 96)
		_make_rock(Vector3(x, 0, z), 0.5 + float(index % 5) * 0.25)
	_make_static_box(Vector3(89, 3.5, 80), Vector3(2, 7, 13), Color("3b3047"), "RuinGate")
	_make_static_box(Vector3(107, 5, 96), Vector3(2, 10, 14), Color("435b86"), "VersionGate")

func _update_day_cycle(delta: float) -> void:
	world_time = fmod(world_time + delta * 0.0018, 1.0)
	var sun = $Sun
	sun.rotation_degrees.x = -15.0 - sin(world_time * TAU) * 55.0
	var daylight := clampf(sin(world_time * TAU) * 0.5 + 0.55, 0.18, 1.0)
	sun.light_energy = 0.35 + daylight * 1.05

func _make_static_box(position: Vector3, size: Vector3, color: Color, node_name: String) -> StaticBody3D:
	var body := StaticBody3D.new()
	body.name = node_name
	body.position = position
	var mesh := MeshInstance3D.new()
	var box := BoxMesh.new()
	box.size = size
	mesh.mesh = box
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.roughness = 0.82
	mesh.material_override = material
	body.add_child(mesh)
	var collision := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = size
	collision.shape = shape
	body.add_child(collision)
	add_child(body)
	return body

func _make_tree(position: Vector3, scale_value: float, ash: bool) -> void:
	var root := Node3D.new()
	root.position = position
	add_child(root)
	_primitive(root, BoxMesh.new(), Vector3(0, 1.5 * scale_value, 0), Vector3(0.3 * scale_value, 3 * scale_value, 0.3 * scale_value), Color("54321f"))
	var crown_color := Color("5c4b40") if ash else Color("28633b")
	_primitive(root, SphereMesh.new(), Vector3(0, 3.3 * scale_value, 0), Vector3(1.1, 1.6, 1.1) * scale_value, crown_color)

func _make_rock(position: Vector3, scale_value: float) -> void:
	var root := Node3D.new()
	root.position = position
	add_child(root)
	_primitive(root, SphereMesh.new(), Vector3(0, scale_value * 0.45, 0), Vector3(scale_value, scale_value * 0.7, scale_value * 0.85), Color("656b77"))

func _make_effect(position: Vector3, color: Color, scale_value: float, lifetime := 0.7) -> MeshInstance3D:
	var effect := _primitive(self, SphereMesh.new(), position, Vector3.ONE * scale_value, color)
	var material = effect.material_override
	if material is StandardMaterial3D:
		material.emission_enabled = true
		material.emission = color
		material.emission_energy_multiplier = 3.0
	var tween := create_tween()
	tween.tween_property(effect, "scale", Vector3.ONE * scale_value * 2.4, lifetime)
	tween.tween_callback(Callable(effect, "queue_free"))
	return effect

func _primitive(parent: Node, mesh: PrimitiveMesh, position: Vector3, scale_value: Vector3, color: Color) -> MeshInstance3D:
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
