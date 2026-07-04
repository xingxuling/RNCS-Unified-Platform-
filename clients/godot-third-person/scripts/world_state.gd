extends Node

signal announcement_posted(message: String)
signal world_changed(snapshot: Dictionary)

const SAVE_PATH := "user://ashen_frontier_world.json"

var state: Dictionary = {
	"format": "rncs.open-world-rpg-state.v0.2",
	"season": "Season 0",
	"region": "灰烬边境",
	"ruins_open": false,
	"boss_defeated": false,
	"next_region": "浮空学院",
	"next_region_open": false,
	"npc_players": 16,
	"history": [],
	"metrics": {"llm_calls": 0, "voice_casts": 0, "sword_swings": 0}
}

func announce(message: String) -> void:
	var entry := {
		"time": Time.get_unix_time_from_system(),
		"message": message
	}
	var history: Array = state.get("history", [])
	history.push_front(entry)
	if history.size() > 120:
		history.resize(120)
	state["history"] = history
	announcement_posted.emit(message)
	world_changed.emit(snapshot())

func snapshot() -> Dictionary:
	return state.duplicate(true)

func save_world(player_data: Dictionary) -> bool:
	var payload := snapshot()
	payload["player"] = player_data
	var file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file == null:
		push_error("Unable to open save file: %s" % SAVE_PATH)
		return false
	file.store_string(JSON.stringify(payload, "  "))
	announce("【系统】世界状态已保存。")
	return true

func load_world() -> Dictionary:
	if not FileAccess.file_exists(SAVE_PATH):
		return {}
	var file := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if file == null:
		return {}
	var parsed = JSON.parse_string(file.get_as_text())
	if parsed is Dictionary:
		for key in state.keys():
			if parsed.has(key):
				state[key] = parsed[key]
		return parsed
	return {}
