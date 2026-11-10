import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:labodc_mobile/features/work/work_page.dart';
import 'package:labodc_mobile/features/work/work_repository.dart';

class FakeWorkRepository implements WorkRepository {
  String taskStatus = 'ASSIGNED';
  String reportStatus = 'DRAFT';
  int startCount = 0;
  int submitTaskCount = 0;
  int createReportCount = 0;
  int submitReportCount = 0;

  @override
  Future<TalentTeam> getMyTeam(String accessToken) async => const TalentTeam(
        id: 'team-1',
        status: 'ACTIVE',
        projectTitle: 'Mobile platform',
        projectCode: 'ODC-001',
        members: [
          TeamMember(
            userId: 'talent-1',
            fullName: 'Talent Student',
            role: 'LEADER',
          ),
        ],
      );

  @override
  Future<List<AssignedTask>> getMyTasks(String accessToken) async => [
        AssignedTask(
          id: 'task-1',
          title: 'Build mobile screen',
          description: 'Implement the assigned screen.',
          status: taskStatus,
          assignmentType: 'TEAM',
          assignedUserId: null,
          templateVersion: '1.0.0-demo',
          dueAt: null,
        ),
      ];

  @override
  Future<List<TalentReport>> getMyReports(String accessToken) async => [
        TalentReport(
          id: 'report-1',
          authorUserId: 'talent-1',
          periodType: 'MONTH',
          periodStart: '2026-11-01',
          periodEnd: '2026-11-10',
          summary: 'November progress',
          progress: 'Implementation is underway.',
          blockers: '',
          nextSteps: 'Run tests.',
          status: reportStatus,
          reviewNote: null,
        ),
      ];

  @override
  Future<void> startTask(String taskId, String accessToken) async {
    startCount++;
    taskStatus = 'IN_PROGRESS';
  }

  @override
  Future<void> submitTask({
    required String taskId,
    required String content,
    required String templateVersion,
    required String accessToken,
  }) async {
    submitTaskCount++;
    taskStatus = 'SUBMITTED_FOR_REVIEW';
  }

  @override
  Future<void> createTeamReport({
    required String periodStart,
    required String periodEnd,
    required String summary,
    required String progress,
    required String blockers,
    required String nextSteps,
    required String accessToken,
  }) async {
    createReportCount++;
  }

  @override
  Future<void> submitReport(String reportId, String accessToken) async {
    submitReportCount++;
    reportStatus = 'SUBMITTED';
  }

  @override
  Future<List<WorkFile>> getTaskFiles(
    String taskId,
    String accessToken,
  ) async =>
      [];

  @override
  Future<List<WorkFile>> getReportFiles(
    String reportId,
    String accessToken,
  ) async =>
      [];

  @override
  Future<WorkFile?> pickAndUploadTaskDocument(
    String taskId,
    String accessToken,
  ) async =>
      null;

  @override
  Future<WorkFile?> pickAndUploadReportDocument(
    String reportId,
    String accessToken,
  ) async =>
      null;

  @override
  Future<WorkFile> uploadTaskDocument({
    required String taskId,
    required String fileName,
    required List<int> bytes,
    required String accessToken,
  }) async =>
      throw UnimplementedError();

  @override
  Future<WorkFile> uploadReportDocument({
    required String reportId,
    required String fileName,
    required List<int> bytes,
    required String accessToken,
  }) async =>
      throw UnimplementedError();

  @override
  Future<void> openDownload(String fileId, String accessToken) async {}
}

void main() {
  testWidgets('shows assigned work and enforces task state transitions',
      (tester) async {
    final repository = FakeWorkRepository();
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: WorkPage(
            repository: repository,
            accessToken: 'access-token',
            userId: 'talent-1',
            isTeamLeader: true,
          ),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Mobile platform'), findsOneWidget);
    expect(find.text('Build mobile screen'), findsOneWidget);
    expect(find.text('Bắt đầu'), findsOneWidget);
    expect(find.text('Tạo báo cáo'), findsOneWidget);

    await tester.tap(find.text('Bắt đầu'));
    await tester.pumpAndSettle();
    expect(repository.startCount, 1);
    expect(find.text('Nộp kết quả'), findsOneWidget);

    await tester.tap(find.text('Nộp kết quả'));
    await tester.pumpAndSettle();
    await tester.enterText(
      find.byType(TextField).last,
      'https://example.test/deliverable',
    );
    await tester.tap(find.text('Nộp').last);
    await tester.pumpAndSettle();
    expect(repository.submitTaskCount, 1);
    expect(find.text('Chờ duyệt'), findsOneWidget);
  });

  testWidgets('only team leader sees report submission actions', (tester) async {
    final repository = FakeWorkRepository();
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: WorkPage(
            repository: repository,
            accessToken: 'access-token',
            userId: 'talent-2',
            isTeamLeader: true,
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('November progress'), findsOneWidget);
    expect(find.text('Tạo báo cáo'), findsNothing);
    expect(find.text('Gửi báo cáo'), findsNothing);
  });
}
