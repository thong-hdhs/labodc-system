import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:labodc_mobile/core/api/api_client.dart';
import 'package:labodc_mobile/features/applications/application_repository.dart';

void main() {
  test('lists only the authenticated talent applications', () async {
    final api = ApiClient(
      client: MockClient((request) async {
        expect(request.method, 'GET');
        expect(request.url.path, '/api/v1/talent/me/applications');
        expect(request.headers['authorization'], 'Bearer token');
        return http.Response(
          jsonEncode([
            {
              'id': 'application-1',
              'projectId': 'project-1',
              'status': 'SUBMITTED',
              'createdAt': '2026-11-10T01:00:00.000Z',
              'project': {
                'id': 'project-1',
                'code': 'ODC-001',
                'title': 'Mobile platform',
                'companyName': 'UTH Labs',
                'status': 'PUBLISHED',
              },
              'stateHistory': [
                {
                  'toStatus': 'SUBMITTED',
                  'createdAt': '2026-11-10T01:00:00.000Z',
                },
              ],
            },
          ]),
          200,
        );
      }),
      baseUrl: 'https://api.example.test/api/v1',
    );
    final repository = ApplicationRepository(api);

    final applications = await repository.listMine('token');

    expect(applications.single.projectTitle, 'Mobile platform');
    expect(applications.single.canWithdraw, isTrue);
    api.close();
  });

  test('uses the existing apply and withdraw endpoints', () async {
    final seen = <String>[];
    final api = ApiClient(
      client: MockClient((request) async {
        seen.add('${request.method} ${request.url.path}');
        expect(request.headers['authorization'], 'Bearer token');
        return http.Response('{}', 201);
      }),
      baseUrl: 'https://api.example.test/api/v1',
    );
    final repository = ApplicationRepository(api);

    await repository.submit('project-1', 'token');
    await repository.withdraw('application-1', 'token');

    expect(
      seen,
      [
        'POST /api/v1/projects/project-1/applications',
        'POST /api/v1/applications/application-1/withdraw',
      ],
    );
    api.close();
  });

  test('preserves server conflict details for safe duplicate handling',
      () async {
    final api = ApiClient(
      client: MockClient(
        (_) async => http.Response(
          jsonEncode({'message': 'Bạn đã có đơn đang xử lý.'}),
          409,
        ),
      ),
      baseUrl: 'https://api.example.test/api/v1',
    );
    final repository = ApplicationRepository(api);

    await expectLater(
      repository.submit('project-1', 'token'),
      throwsA(
        isA<ApiException>()
            .having((error) => error.statusCode, 'statusCode', 409)
            .having((error) => error.message, 'message', contains('đơn')),
      ),
    );
    api.close();
  });

  test('keeps application status when the related project is unavailable',
      () {
    final application = TalentApplication.fromJson({
      'id': 'application-1',
      'projectId': 'project-1',
      'status': 'WITHDRAWN',
      'createdAt': '2026-11-10T01:00:00.000Z',
      'project': null,
      'stateHistory': [],
    });

    expect(application.projectTitle, 'Dự án không còn khả dụng');
    expect(application.canWithdraw, isFalse);
  });
}
