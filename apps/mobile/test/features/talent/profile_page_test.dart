import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:labodc_mobile/core/auth/auth_models.dart';
import 'package:labodc_mobile/core/files/private_file_repository.dart';
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

class FakeProfileFileStore implements ProfileFileStore {
  List<PrivateFile> files = const [];
  int avatarUploads = 0;

  @override
  Future<List<PrivateFile>> listMine(String accessToken) async => files;

  @override
  Future<PrivateFile?> pickAndUploadAvatar(String accessToken) async {
    avatarUploads++;
    const file = PrivateFile(
      id: 'avatar-1',
      category: 'AVATAR',
      fileName: 'avatar.png',
      sizeBytes: 1024,
      status: 'UPLOADED',
    );
    files = [file];
    return file;
  }

  @override
  Future<PrivateFile?> pickAndUploadPortfolio(String accessToken) async => null;

  @override
  Future<void> openDownload(String fileId, String accessToken) async {}
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
          body: ProfilePage(
            session: session,
            repository: repository,
            fileRepository: FakeProfileFileStore(),
          ),
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
          body: ProfilePage(
            session: session,
            repository: repository,
            fileRepository: FakeProfileFileStore(),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.textContaining('profile unavailable'), findsOneWidget);
  });

  testWidgets('requires a saved profile before upload and lists its private file',
      (tester) async {
    final repository = FakeTalentRepository();
    final files = FakeProfileFileStore();
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: ProfilePage(
            session: session,
            repository: repository,
            fileRepository: files,
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    final avatarButton = tester.widget<OutlinedButton>(
      find.widgetWithText(OutlinedButton, 'Tải ảnh đại diện'),
    );
    expect(avatarButton.onPressed, isNull);
    expect(find.text('Lưu hồ sơ trước khi tải tệp lên.'), findsOneWidget);

    await tester.enterText(find.byType(TextFormField).at(0), 'S123');
    await tester.enterText(find.byType(TextFormField).at(1), 'Talent Student');
    await tester.tap(find.text('Lưu hồ sơ'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Tải ảnh đại diện'));
    await tester.tap(find.text('Tải ảnh đại diện'));
    await tester.pumpAndSettle();

    expect(files.avatarUploads, 1);
    expect(find.text('avatar.png'), findsOneWidget);
    expect(find.text('Đã tải lên avatar.png.'), findsOneWidget);
  });
}
