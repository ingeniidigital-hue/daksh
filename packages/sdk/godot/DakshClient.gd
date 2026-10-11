extends Node
class_name DakshClient

signal auth_completed(success: bool, player_data: Dictionary)
signal catalog_loaded(items: Array)

var base_url: String = "http://localhost:3000"
var http_request: HTTPRequest
var current_title_id: String = ""
var session_token: String = ""

func _ready():
	http_request = HTTPRequest.new()
	add_child(http_request)
	http_request.request_completed.connect(_on_request_completed)

func authenticate_device(title_id: String, device_id: String):
	current_title_id = title_id
	var url = base_url + "/api/titles/" + title_id + "/players"
	var headers = ["Content-Type: application/json"]
	var body = JSON.stringify({
		"deviceId": device_id,
		"platform": "godot"
	})
	http_request.request(url, headers, HTTPClient.METHOD_POST, body)

func _on_request_completed(result: int, response_code: int, headers: PackedStringArray, body: PackedByteArray):
	if response_code == 200 or response_code == 201:
		var json = JSON.parse_string(body.get_string_from_utf8())
		if json != null:
			if json.has("token"):
				session_token = json["token"]
			auth_completed.emit(true, json)
			return
	auth_completed.emit(false, {})
