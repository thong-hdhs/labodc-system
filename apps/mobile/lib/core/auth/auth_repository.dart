import 'dart:convert';

import '../api/api_client.dart';
import 'auth_models.dart';
import 'secure_token_store.dart';

class AuthRepository {
  AuthRepository({required ApiClient api, required SecureTokenStore storage})
      : _api = api,
        _storage = storage;

  final ApiClient _api;
  final SecureTokenStore _storage;

  Future<AuthSession?> restoreSession() async {
    final accessToken =
        await _storage.read(FlutterSecureTokenStore.accessTokenKey);
    final encodedUser = await _storage.read(FlutterSecureTokenStore.userKey);
    if (accessToken == null || encodedUser == null) {
      await _storage.clear();
      return null;
    }

    late final AuthUser user;
    try {
      final decodedUser = jsonDecode(encodedUser);
      if (decodedUser is! Map<String, dynamic>) {
        throw const FormatException();
      }
      user = AuthUser.fromJson(decodedUser);
    } on FormatException {
      await _storage.clear();
      return null;
    }

    try {
      final response = await _api.get('/auth/me', accessToken: accessToken);
      final serverUser = response['user'];
      if (serverUser is! Map<String, dynamic> ||
          serverUser['sub'] != user.id ||
          serverUser['role'] != user.role ||
          serverUser['status'] != user.status ||
          !_isTalentRole(user.role)) {
        await _storage.clear();
        return null;
      }
      return AuthSession(user: user, accessToken: accessToken);
    } on ApiException catch (error) {
      if (error.statusCode == 401 || error.statusCode == 403) {
        await _storage.clear();
        return null;
      }
      rethrow;
    }
  }

  Future<AuthSession> login(String email, String password) async {
    final response = await _api.post(
      '/auth/login',
      body: {'email': email.trim(), 'password': password},
    );
    final accessToken = response['accessToken'];
    final refreshToken = response['refreshToken'];
    final userData = response['user'];
    if (accessToken is! String ||
        accessToken.isEmpty ||
        refreshToken is! String ||
        refreshToken.isEmpty ||
        userData is! Map<String, dynamic>) {
      throw const FormatException('Phản hồi đăng nhập không hợp lệ.');
    }

    final user = AuthUser.fromJson(userData);
    if (!_isTalentRole(user.role)) {
      throw const ApiException('Ứng dụng này chỉ dành cho Talent.');
    }
    if (user.status != 'ACTIVE') {
      throw const ApiException('Tài khoản chưa ở trạng thái hoạt động.');
    }

    await _storage.write(
      FlutterSecureTokenStore.userKey,
      jsonEncode(user.toJson()),
    );
    await _storage.write(FlutterSecureTokenStore.refreshTokenKey, refreshToken);
    await _storage.write(FlutterSecureTokenStore.accessTokenKey, accessToken);
    return AuthSession(user: user, accessToken: accessToken);
  }

  Future<void> logout(String accessToken) async {
    await _storage.clear();
    await _api.post('/auth/logout', accessToken: accessToken);
  }

  bool _isTalentRole(String role) =>
      role == 'TALENT' || role == 'TALENT_LEADER';
}
