import 'package:shared_preferences/shared_preferences.dart';

class SessionStorage {
  static const _phoneKey = 'speedcash.phone';
  static const _countryCodeKey = 'speedcash.countryCode';
  static const _referenceKey = 'speedcash.pendingReference';
  static const _pendingTypeKey = 'speedcash.pendingType';

  Future<void> saveSession({
    required String phone,
    required String countryCode,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_phoneKey, phone);
    await prefs.setString(_countryCodeKey, countryCode);
  }

  Future<Map<String, String>> readSession() async {
    final prefs = await SharedPreferences.getInstance();
    return {
      'phone': prefs.getString(_phoneKey) ?? '',
      'countryCode': prefs.getString(_countryCodeKey) ?? 'ZM',
    };
  }

  Future<void> clearSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_phoneKey);
    await prefs.remove(_countryCodeKey);
  }

  Future<void> savePendingGateway({
    required String reference,
    required String type,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_referenceKey, reference);
    await prefs.setString(_pendingTypeKey, type);
  }

  Future<Map<String, String>> readPendingGateway() async {
    final prefs = await SharedPreferences.getInstance();
    return {
      'reference': prefs.getString(_referenceKey) ?? '',
      'type': prefs.getString(_pendingTypeKey) ?? '',
    };
  }

  Future<void> clearPendingGateway() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_referenceKey);
    await prefs.remove(_pendingTypeKey);
  }
}
