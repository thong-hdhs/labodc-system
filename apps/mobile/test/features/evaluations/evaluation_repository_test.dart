import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:labodc_mobile/core/api/api_client.dart';
import 'package:labodc_mobile/features/evaluations/evaluation_repository.dart';

void main() {
  test('loads only the current Talent evaluations and sends ack/reply actions',
      () async {
    final requests = <String>[];
    final api = ApiClient(
      client: MockClient((request) async {
        requests.add('${request.method} ${request.url.path}');
        expect(request.headers['authorization'], 'Bearer token');
        if (request.method == 'GET') {
          return http.Response(
            jsonEncode([
              {
                'id': 'eval-1',
                'periodStart': '2026-10-01',
                'periodEnd': '2026-10-31',
                'criteria': [
                  {'criterion': 'Giao tiếp', 'feedback': 'Diễn đạt rõ ràng.'},
                ],
                'overallFeedback': 'Tiếp tục phát huy.',
                'finalizedAt': '2026-11-01T10:00:00.000Z',
                'candidateAcknowledgedAt': null,
                'candidateFeedback': null,
                'candidateFeedbackAt': null,
              },
            ]),
            200,
          );
        }
        if (request.url.path.endsWith('/feedback')) {
          expect(jsonDecode(request.body), {'feedback': 'Đã nhận phản hồi.'});
        }
        return http.Response('{}', 201);
      }),
      baseUrl: 'https://api.example.test/api/v1',
    );
    final evaluations = await EvaluationRepository(api).listMine('token');
    await EvaluationRepository(api).acknowledge('eval-1', 'token');
    await EvaluationRepository(api).submitFeedback(
      'eval-1',
      'Đã nhận phản hồi.',
      'token',
    );

    expect(evaluations.single.id, 'eval-1');
    expect(evaluations.single.criteria.single.feedback, 'Diễn đạt rõ ràng.');
    expect(evaluations.single.isAcknowledged, isFalse);
    expect(requests, [
      'GET /api/v1/talent/me/evaluations',
      'POST /api/v1/talent/evaluations/eval-1/acknowledge',
      'POST /api/v1/talent/evaluations/eval-1/feedback',
    ]);
    api.close();
  });
}
