import '../../core/api/api_client.dart';

class TalentProfile {
  const TalentProfile({
    required this.studentId,
    required this.fullName,
    required this.faculty,
    required this.major,
    required this.cohort,
    required this.bio,
    required this.skills,
    required this.certifications,
  });

  final String studentId;
  final String fullName;
  final String? faculty;
  final String? major;
  final String? cohort;
  final String? bio;
  final List<String> skills;
  final List<String> certifications;

  factory TalentProfile.fromJson(Map<String, dynamic> json) {
    return TalentProfile(
      studentId: json['studentId'] as String,
      fullName: json['fullName'] as String,
      faculty: json['faculty'] as String?,
      major: json['major'] as String?,
      cohort: json['cohort'] as String?,
      bio: json['bio'] as String?,
      skills: _stringList(json['skills']),
      certifications: _stringList(json['certifications']),
    );
  }

  static List<String> _stringList(Object? value) {
    if (value is! List || value.any((item) => item is! String)) {
      throw const FormatException('Danh sách hồ sơ trả về không hợp lệ.');
    }
    return value.cast<String>().toList(growable: false);
  }
}

class TalentRepository {
  const TalentRepository(this._api);

  final ApiClient _api;

  Future<TalentProfile?> getMyProfile(String accessToken) async {
    final response =
        await _api.get('/talent/me/profile', accessToken: accessToken);
    final profile = response['profile'];
    if (profile == null) return null;
    if (profile is! Map<String, dynamic>) {
      throw const FormatException('Hồ sơ trả về không đúng định dạng.');
    }
    return TalentProfile.fromJson(profile);
  }

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
    await _api.put(
      '/talent/me/profile',
      accessToken: accessToken,
      body: {
        'studentId': studentId,
        'fullName': fullName,
        'faculty': faculty,
        'major': major,
        'cohort': cohort,
        'bio': bio,
        'skills': skills,
        'certifications': certifications,
      },
    );
  }
}
