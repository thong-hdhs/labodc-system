import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:labodc_mobile/core/api/api_client.dart';
import 'package:labodc_mobile/core/auth/auth_models.dart';
import 'package:labodc_mobile/core/auth/auth_repository.dart';
import 'package:labodc_mobile/core/auth/secure_token_store.dart';
import 'package:labodc_mobile/features/auth/login_page.dart';

class LoginTestStore implements SecureTokenStore {
  final values = <String, String>{};

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
  testWidgets('shows API login errors and leaves credentials unpersisted',
      (tester) async {
    final storage = LoginTestStore();
    final api = ApiClient(
      client: MockClient(
        (_) async => http.Response(
          jsonEncode({'message': 'Thông tin đăng nhập không hợp lệ.'}),
          401,
          headers: {'content-type': 'application/json'},
        ),
      ),
      baseUrl: 'https://api.example.test/api/v1',
    );
    final repository = AuthRepository(api: api, storage: storage);
    await tester.pumpWidget(
      MaterialApp(
        home: LoginPage(
          authRepository: repository,
          onAuthenticated: (_) {},
        ),
      ),
    );

    await tester.enterText(
      find.byKey(const ValueKey('login-email')),
      'talent@student.uth.edu.vn',
    );
    await tester.enterText(
      find.byKey(const ValueKey('login-password')),
      'incorrect',
    );
    await tester.tap(find.text('Đăng nhập'));
    await tester.pumpAndSettle();

    expect(find.text('Thông tin đăng nhập không hợp lệ.'), findsOneWidget);
    expect(storage.values, isEmpty);
    api.close();
  });

  testWidgets('rejects invalid form input before making an API request',
      (tester) async {
    var requestCount = 0;
    final api = ApiClient(
      client: MockClient((_) async {
        requestCount++;
        return http.Response('{}', 200);
      }),
      baseUrl: 'https://api.example.test/api/v1',
    );
    final repository = AuthRepository(api: api, storage: LoginTestStore());
    await tester.pumpWidget(
      MaterialApp(
        home: LoginPage(
          authRepository: repository,
          onAuthenticated: (_) {},
        ),
      ),
    );

    await tester.tap(find.text('Đăng nhập'));
    await tester.pumpAndSettle();

    expect(requestCount, 0);
    expect(find.text('Vui lòng nhập email.'), findsOneWidget);
    expect(find.text('Vui lòng nhập mật khẩu.'), findsOneWidget);
    api.close();
  });
}
