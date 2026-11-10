import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:labodc_mobile/core/api/api_client.dart';
import 'package:labodc_mobile/features/work/work_repository.dart';

void main() {
  test('parses team, assigned tasks, and progress reports', () async {
    final api = ApiClient(
      client: MockClient((request) async {
        expect(request.headers['authorization'], 'Bearer token');
        switch (request.url.path) {
          case '/api/v1/talent/me/team':
            return http.Response(
              jsonEncode({
                'id': 'team-1',
                'status': 'ACTIVE',
                'members': [
                  {
                    'userId': 'talent-1',
                    'fullName': 'Talent Student',
                    'role': 'LEADER',
                  },
                ],
                'project': {
                  'id': 'project-1',
                  'code': 'ODC-001',
                  'title': 'Mobile platform',
                },
              }),
              200,
            );
          case '/api/v1/talent/me/tasks':
            return http.Response(
              jsonEncode([
                {
                  'id': 'task-1',
                  'title': 'Build mobile screen',
                  'description': 'Implement the assigned screen.',
                  'status': 'ASSIGNED',
                  'assignmentType': 'TEAM',
                  'assignedUserId': null,
                  'templateVersion': '1.0.0-demo',
                  'dueAt': null,
                },
              ]),
              200,
            );
          case '/api/v1/talent/me/reports':
            return http.Response(
              jsonEncode([
                {
                  'id': 'report-1',
                  'authorUserId': 'talent-1',
                  'periodType': 'MONTH',
                  'periodStart': '2026-11-01',
                  'periodEnd': '2026-11-10',
                  'summary': 'November progress',
                  'progress': 'Underway',
                  'blockers': '',
                  'nextSteps': 'Run tests.',
                  'status': 'DRAFT',
                  'reviewNote': null,
                },
              ]),
              200,
            );
          default:
            fail('Unexpected endpoint ${request.url.path}');
        }
      }),
      baseUrl: 'https://api.example.test/api/v1',
    );
    final work = WorkRepository(api);

    final team = await work.getMyTeam('token');
    final tasks = await work.getMyTasks('token');
    final reports = await work.getMyReports('token');

    expect(team.projectTitle, 'Mobile platform');
    expect(team.members.single.role, 'LEADER');
    expect(tasks.single.canStart, isTrue);
    expect(reports.single.canSubmit, isTrue);
    api.close();
  });

  test('sends report period and content using Talent Leader API contract',
      () async {
    final api = ApiClient(
      client: MockClient((request) async {
        expect(request.method, 'POST');
        expect(request.url.path, '/api/v1/talent/me/reports');
        expect(jsonDecode(request.body), {
          'periodType': 'MONTH',
          'periodStart': '2026-11-01',
          'periodEnd': '2026-11-10',
          'summary': 'Summary',
          'progress': 'Progress',
          'blockers': '',
          'nextSteps': 'Next',
        });
        return http.Response('{}', 201);
      }),
      baseUrl: 'https://api.example.test/api/v1',
    );

    await WorkRepository(api).createTeamReport(
      periodStart: '2026-11-01',
      periodEnd: '2026-11-10',
      summary: 'Summary',
      progress: 'Progress',
      blockers: '',
      nextSteps: 'Next',
      accessToken: 'token',
    );
    api.close();
  });

  test('uses the existing task start/submission and report submit contracts',
      () async {
    final requests = <String>[];
    final api = ApiClient(
      client: MockClient((request) async {
        requests.add('${request.method} ${request.url.path}');
        if (request.url.path.endsWith('/submissions')) {
          expect(jsonDecode(request.body), {
            'content': 'https://example.test/deliverable',
            'templateVersion': '1.0.0-demo',
          });
        }
        return http.Response('{}', 200);
      }),
      baseUrl: 'https://api.example.test/api/v1',
    );
    final repository = WorkRepository(api);

    await repository.startTask('task-1', 'token');
    await repository.submitTask(
      taskId: 'task-1',
      content: 'https://example.test/deliverable',
      templateVersion: '1.0.0-demo',
      accessToken: 'token',
    );
    await repository.submitReport('report-1', 'token');

    expect(requests, [
      'POST /api/v1/talent/tasks/task-1/start',
      'POST /api/v1/talent/tasks/task-1/submissions',
      'POST /api/v1/reports/report-1/submit',
    ]);
    api.close();
  });

  test('uploads task files through signed intent, Cloudinary, then completion',
      () async {
    final apiRequests = <String>[];
    final api = ApiClient(
      client: MockClient((request) async {
        apiRequests.add(request.url.path);
        if (request.url.path == '/api/v1/files/upload-intents') {
          expect(jsonDecode(request.body), {
            'category': 'TASK_DOCUMENT',
            'fileName': 'deliverable.pdf',
            'mimeType': 'application/pdf',
            'sizeBytes': 4,
            'taskId': 'task-1',
          });
          return http.Response(
            jsonEncode({
              'file': {'id': 'file-1'},
              'uploadUrl':
                  'https://api.cloudinary.com/v1_1/demo/raw/upload',
              'uploadFields': {
                'api_key': 'test-key',
                'signature': 'test-signature',
                'timestamp': '123',
              },
            }),
            201,
          );
        }
        expect(request.url.path, '/api/v1/files/file-1/complete');
        return http.Response(
          jsonEncode({
            'id': 'file-1',
            'fileName': 'deliverable.pdf',
            'sizeBytes': 4,
            'status': 'UPLOADED',
          }),
          200,
        );
      }),
      baseUrl: 'https://api.example.test/api/v1',
    );
    final uploadClient = MockClient((request) async {
      expect(request.url.host, 'api.cloudinary.com');
      expect(request, isA<http.MultipartRequest>());
      final multipart = request as http.MultipartRequest;
      expect(multipart.fields['signature'], 'test-signature');
      expect(multipart.files.single.filename, 'deliverable.pdf');
      return http.Response('{}', 200);
    });
    final repository = WorkRepository(api, uploadClient: uploadClient);

    final file = await repository.uploadTaskDocument(
      taskId: 'task-1',
      fileName: 'deliverable.pdf',
      bytes: [1, 2, 3, 4],
      accessToken: 'token',
    );

    expect(apiRequests, [
      '/api/v1/files/upload-intents',
      '/api/v1/files/file-1/complete',
    ]);
    expect(file.status, 'UPLOADED');
    api.close();
    uploadClient.close();
  });

  test('rejects unsupported files before creating an upload intent', () async {
    final api = ApiClient(
      client: MockClient((_) async {
        fail('Invalid file should not create an upload intent.');
      }),
      baseUrl: 'https://api.example.test/api/v1',
    );

    await expectLater(
      WorkRepository(api).uploadTaskDocument(
        taskId: 'task-1',
        fileName: 'payload.exe',
        bytes: [1],
        accessToken: 'token',
      ),
      throwsA(isA<ApiException>()),
    );
    api.close();
  });

  test('does not treat unassigned tasks as actionable', () {
    final task = AssignedTask(
      id: 'task-1',
      title: 'Unassigned',
      description: '',
      status: 'ASSIGNED',
      assignmentType: null,
      assignedUserId: null,
      templateVersion: '1.0.0-demo',
      dueAt: null,
    );
    expect(task.canStart, isFalse);
    expect(task.assignmentType, isNull);
  });
}
