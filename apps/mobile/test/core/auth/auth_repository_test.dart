import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:labodc_mobile/core/api/api_client.dart';
import 'package:labodc_mobile/core/auth/auth_repository.dart';
import 'package:labodc_mobile/core/auth/secure_token_store.dart';

class MemorySecureTokenStore implements SecureTokenStore {
  final Map<String, String> values = {};

  @override
  Future<void> clear() async {
    values.clear();
  }

  @override
  Future<String?> read(String key) async => values[key];

  @override
  Future<void> write(String key, String value) async {
    values[key] = value;
  }
}

void main() {
  const user = {
    'id': 'talent-1',
    'email': 'talent@student.uth.edu.vn',
    'fullName': 'Talent Student',
    'role': 'TALENT',
    'status': 'ACTIVE',
  };

  test('persists tokens and account in secure store after Talent login', () async {
    final storage = MemorySecureTokenStore();
    final api = ApiClient(
      client: MockClient((request) async {
        expect(request.url.path, '/api/v1/auth/login');
        expect(request.method, 'POST');
        expect(jsonDecode(request.body), {
          'email': 'talent@student.uth.edu.vn',
          'password': 'secret',
        });
        return httpResponse({
          'accessToken': 'access-token',
          'refreshToken': 'refresh-token',
          'user': user,
        });
      }),
      baseUrl: 'https://api.example.test/api/v1',
    );
    final repository = AuthRepository(api: api, storage: storage);

    final session =
        await repository.login(' talent@student.uth.edu.vn ', 'secret');

    expect(session.user.id, 'talent-1');
    expect(storage.values[FlutterSecureTokenStore.accessTokenKey], 'access-token');
    expect(storage.values[FlutterSecureTokenStore.refreshTokenKey], 'refresh-token');
    expect(
      jsonDecode(storage.values[FlutterSecureTokenStore.userKey]!),
      user,
    );
    api.close();
  });

  test('rejects non-Talent accounts without persisting returned tokens', () async {
    final storage = MemorySecureTokenStore();
    final api = ApiClient(
      client: MockClient((_) async => httpResponse({
        'accessToken': 'enterprise-token',
        'refreshToken': 'refresh-token',
        'user': {...user, 'role': 'ENTERPRISE'},
      })),
      baseUrl: 'https://api.example.test/api/v1',
    );
    final repository = AuthRepository(api: api, storage: storage);

    await expectLater(
      repository.login('enterprise@example.test', 'secret'),
      throwsA(isA<ApiException>()),
    );
    expect(storage.values, isEmpty);
    api.close();
  });

  test('restores a session only after server confirms its identity and role', () async {
    final storage = MemorySecureTokenStore()
      ..values[FlutterSecureTokenStore.accessTokenKey] = 'access-token'
      ..values[FlutterSecureTokenStore.refreshTokenKey] = 'refresh-token'
      ..values[FlutterSecureTokenStore.userKey] = jsonEncode(user);
    final api = ApiClient(
      client: MockClient((request) async {
        expect(request.url.path, '/api/v1/auth/me');
        expect(request.headers['authorization'], 'Bearer access-token');
        return httpResponse({
          'user': {
            'sub': 'talent-1',
            'email': user['email'],
            'role': 'TALENT',
            'status': 'ACTIVE',
          },
        });
      }),
      baseUrl: 'https://api.example.test/api/v1',
    );
    final repository = AuthRepository(api: api, storage: storage);

    final session = await repository.restoreSession();

    expect(session?.user.id, 'talent-1');
    api.close();
  });

  test('clears stale credentials when the access token is unauthorized', () async {
    final storage = MemorySecureTokenStore()
      ..values[FlutterSecureTokenStore.accessTokenKey] = 'expired'
      ..values[FlutterSecureTokenStore.userKey] = jsonEncode(user);
    final api = ApiClient(
      client: MockClient(
        (_) async => httpResponse({'message': 'expired'}, statusCode: 401),
      ),
      baseUrl: 'https://api.example.test/api/v1',
    );
    final repository = AuthRepository(api: api, storage: storage);

    expect(await repository.restoreSession(), isNull);
    expect(storage.values, isEmpty);
    api.close();
  });
}

http.Response httpResponse(
  Map<String, Object?> body, {
  int statusCode = 200,
}) =>
    http.Response(jsonEncode(body), statusCode, headers: {
      'content-type': 'application/json; charset=utf-8',
    });
