import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

class LocalStorage {
  SharedPreferences? _prefs;

  Future<void> init() async {
    _prefs ??= await SharedPreferences.getInstance();
  }

  Future<bool> setString(String key, String value) async {
    await init();
    return _prefs!.setString(key, value);
  }

  Future<bool> setJson(String key, Object value) async {
    return setString(key, jsonEncode(value));
  }

  String? getString(String key) {
    if (_prefs == null) return null;
    return _prefs!.getString(key);
  }

  T? getJson<T>(String key, T Function(Map<String, dynamic>) fromJson) {
    if (_prefs == null) return null;
    final raw = _prefs!.getString(key);
    if (raw == null) return null;
    final decoded = jsonDecode(raw) as Map<String, dynamic>;
    return fromJson(decoded);
  }

  List<Map<String, dynamic>> getJsonList(String key) {
    if (_prefs == null) return [];
    final raw = _prefs!.getString(key);
    if (raw == null) return [];
    final decoded = jsonDecode(raw);
    if (decoded is List) {
      return decoded.cast<Map<String, dynamic>>();
    }
    return [];
  }

  Future<bool> remove(String key) async {
    await init();
    return _prefs!.remove(key);
  }
}
