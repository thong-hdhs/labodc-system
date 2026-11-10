import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:labodc_mobile/core/api/api_client.dart';
import 'package:labodc_mobile/features/applications/application_page.dart';
import 'package:labodc_mobile/features/applications/application_repository.dart';

class FakeApplicationRepository implements ApplicationRepository {
  int withdrawCount = 0;
  bool failList = false;
  bool failWithdraw = false;
  String status = 'SUBMITTED';

  @override
  Future<List<TalentApplication>> listMine(String accessToken) async {
    if (failList) throw const ApiException('network unavailable');
    return [
      TalentApplication(
        id: 'application-1',
        projectId: 'project-1',
        status: status,
        createdAt: '2026-11-10T01:00:00.000Z',
        projectTitle: 'Mobile platform',
        projectCode: 'ODC-001',
        stateHistory: [
          ApplicationStateChange(
            status: status,
            createdAt: '2026-11-10T01:00:00.000Z',
          ),
        ],
      ),
    ];
  }

  @override
  Future<void> submit(String projectId, String accessToken) async {}

  @override
  Future<void> withdraw(String applicationId, String accessToken) async {
    withdrawCount++;
    if (failWithdraw) throw const ApiException('conflict', statusCode: 409);
    status = 'WITHDRAWN';
  }
}

void main() {
  testWidgets('shows own application and withdraws only after confirmation',
      (tester) async {
    final repository = FakeApplicationRepository();
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: ApplicationPage(
            repository: repository,
            accessToken: 'access-token',
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Mobile platform'), findsOneWidget);
    expect(find.text('Đã gửi'), findsOneWidget);
    await tester.tap(find.text('Rút đơn'));
    await tester.pumpAndSettle();
    expect(repository.withdrawCount, 0);

    await tester.tap(find.text('Rút đơn').last);
    await tester.pumpAndSettle();
    expect(repository.withdrawCount, 1);
    expect(find.text('Đã rút'), findsOneWidget);
    expect(find.text('Rút đơn'), findsNothing);
  });

  testWidgets('shows list and withdraw errors without hiding the application',
      (tester) async {
    final repository = FakeApplicationRepository()..failWithdraw = true;
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: ApplicationPage(
            repository: repository,
            accessToken: 'access-token',
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('Rút đơn'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Rút đơn').last);
    await tester.pumpAndSettle();

    expect(find.text('Mobile platform'), findsOneWidget);
    expect(find.byKey(const ValueKey('applications-error')), findsOneWidget);
    expect(find.textContaining('Trạng thái vừa thay đổi'), findsOneWidget);

    repository.failList = true;
    await tester.drag(find.byType(ListView).last, const Offset(0, 400));
    await tester.pumpAndSettle();
    expect(find.textContaining('network unavailable'), findsOneWidget);
  });
}
