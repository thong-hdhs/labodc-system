import 'package:flutter_secure_storage/flutter_secure_storage.dart';

abstract interface class SecureTokenStore {
  Future<String?> read(String key);
  Future<void> write(String key, String value);
  Future<void> clear();
}

class FlutterSecureTokenStore implements SecureTokenStore {
  FlutterSecureTokenStore({FlutterSecureStorage? storage})
      : _storage = storage ?? const FlutterSecureStorage();

  static const accessTokenKey = 'labodc.access_token';
  static const refreshTokenKey = 'labodc.refresh_token';
  static const userKey = 'labodc.auth_user';

  final FlutterSecureStorage _storage;

  @override
  Future<String?> read(String key) => _storage.read(key: key);

  @override
  Future<void> write(String key, String value) =>
      _storage.write(key: key, value: value);

  @override
  Future<void> clear() => _storage.deleteAll();
}
