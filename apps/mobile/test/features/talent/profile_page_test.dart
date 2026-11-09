import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:labodc_mobile/core/auth/auth_models.dart';
import 'package:labodc_mobile/features/talent/profile_page.dart';
import 'package:labodc_mobile/features/talent/talent_repository.dart';

class FakeTalentRepository implements TalentRepository {
  TalentProfile? profile;
  String? failure;
  Map<String, Object?>? savedProfile;

  @override
  Future<TalentProfile?> getMyProfile(String accessToken) async {
    if (failure != null) throw Exception(failure);
    return profile;
  }

  @override
  Future<void> saveMyProfile(
    String accessToken, {
    required String studentId,
    required String fullName,
    required String faculty,
    required String major,
    required String cohort,
    required String bio,
    required List<String> skills,
    required List<String> certifications,
  }) async {
    savedProfile = {
      'studentId': studentId,
      'fullName': fullName,
      'faculty': faculty,
      'major': major,
      'cohort': cohort,
      'bio': bio,
      'skills': skills,
      'certifications': certifications,
    };
  }
}

void main() {
  const session = AuthSession(
    accessToken: 'access-token',
    user: AuthUser(
      id: 'talent-1',
      email: 'talent@student.uth.edu.vn',
      fullName: 'Talent Student',
      role: 'TALENT',
      status: 'ACTIVE',
    ),
  );

  testWidgets('loads profile and saves validated fields through API adapter',
      (tester) async {
    final repository = FakeTalentRepository()
      ..profile = const TalentProfile(
        studentId: 'S123',
        fullName: 'Talent Student',
        faculty: 'CNTT',
        major: 'Software',
        cohort: 'K2024',
        bio: 'About me',
        skills: ['Dart'],
        certifications: [],
      );
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: ProfilePage(session: session, repository: repository),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Hồ sơ Talent'), findsOneWidget);
    final studentId = tester.widget<TextFormField>(
      find.byType(TextFormField).first,
    );
    expect(studentId.controller?.text, 'S123');

    await tester.tap(find.text('Lưu hồ sơ'));
    await tester.pumpAndSettle();
    expect(repository.savedProfile?['studentId'], 'S123');
    expect(repository.savedProfile?['skills'], ['Dart']);
    expect(find.text('Đã lưu hồ sơ Talent.'), findsOneWidget);
  });

  testWidgets('shows an explicit profile loading error', (tester) async {
    final repository = FakeTalentRepository()..failure = 'profile unavailable';
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: ProfilePage(session: session, repository: repository),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.textContaining('profile unavailable'), findsOneWidget);
  });
}
