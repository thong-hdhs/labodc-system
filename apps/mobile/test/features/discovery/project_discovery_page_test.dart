import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:labodc_mobile/features/discovery/project_discovery_page.dart';
import 'package:labodc_mobile/features/discovery/project_repository.dart';

class FakeProjectRepository implements ProjectRepository {
  int lastPage = 1;
  String lastKeyword = '';
  String lastSkill = '';
  bool failSearch = false;

  @override
  Future<ProjectPage> search({
    required String keyword,
    required String skill,
    required int page,
    int pageSize = 20,
  }) async {
    lastKeyword = keyword;
    lastSkill = skill;
    lastPage = page;
    if (failSearch) throw Exception('API unavailable');
    return ProjectPage(
      items: page == 1
          ? const [
              PublicProject(
                id: 'project-1',
                code: 'ODC-001',
                companyName: 'UTH Labs',
                title: 'Mobile platform',
                summary: 'A project summary',
                requiredSkills: ['Dart'],
                minTeamSize: 2,
                maxTeamSize: 5,
                durationWeeks: 8,
              ),
            ]
          : const [],
      page: page,
      pageSize: pageSize,
      totalItems: 1,
      totalPages: 1,
    );
  }

  @override
  Future<PublicProject> getDetails(String projectId) async =>
      const PublicProject(
        id: 'project-1',
        code: 'ODC-001',
        companyName: 'UTH Labs',
        title: 'Mobile platform',
        summary: 'A project summary',
        requiredSkills: ['Dart'],
        minTeamSize: 2,
        maxTeamSize: 5,
        durationWeeks: 8,
        description: 'Full project details',
        deliverables: 'A mobile app',
      );
}

void main() {
  testWidgets('loads eligible projects and opens the project detail', (tester) async {
    final repository = FakeProjectRepository();
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(body: ProjectDiscoveryPage(repository: repository)),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Mobile platform'), findsOneWidget);
    expect(find.text('Tìm thấy 1 dự án đang nhận đơn.'), findsOneWidget);
    await tester.tap(find.text('Xem chi tiết'));
    await tester.pumpAndSettle();
    expect(find.text('Full project details'), findsOneWidget);
    expect(find.text('A mobile app'), findsOneWidget);
  });

  testWidgets('submits keyword and skill filters and shows API errors', (tester) async {
    final repository = FakeProjectRepository();
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(body: ProjectDiscoveryPage(repository: repository)),
      ),
    );
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField).at(0), '  mobile  ');
    await tester.enterText(find.byType(TextField).at(1), ' Dart ');
    await tester.tap(find.byKey(const ValueKey('project-search')));
    await tester.pumpAndSettle();
    expect(repository.lastKeyword, '  mobile  ');
    expect(repository.lastSkill, ' Dart ');

    repository.failSearch = true;
    await tester.tap(find.byKey(const ValueKey('project-search')));
    await tester.pumpAndSettle();
    expect(find.byKey(const ValueKey('project-error')), findsOneWidget);
    expect(find.textContaining('API unavailable'), findsOneWidget);
  });
}
