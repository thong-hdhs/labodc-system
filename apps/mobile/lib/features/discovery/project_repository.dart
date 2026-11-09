import '../../core/api/api_client.dart';

class PublicProject {
  const PublicProject({
    required this.id,
    required this.code,
    required this.companyName,
    required this.title,
    required this.summary,
    required this.requiredSkills,
    required this.minTeamSize,
    required this.maxTeamSize,
    required this.durationWeeks,
    this.description,
    this.deliverables,
  });

  final String id;
  final String code;
  final String companyName;
  final String title;
  final String summary;
  final List<String> requiredSkills;
  final int minTeamSize;
  final int maxTeamSize;
  final int durationWeeks;
  final String? description;
  final String? deliverables;

  factory PublicProject.fromJson(Map<String, dynamic> json) {
    final skills = json['requiredSkills'];
    if (skills is! List || skills.any((skill) => skill is! String)) {
      throw const FormatException('Kỹ năng dự án trả về không hợp lệ.');
    }
    return PublicProject(
      id: _stringValue(json, 'id'),
      code: _stringValue(json, 'code'),
      companyName: _stringValue(json, 'companyName'),
      title: _stringValue(json, 'title'),
      summary: _stringValue(json, 'summary'),
      requiredSkills: skills.cast<String>().toList(growable: false),
      minTeamSize: _intValue(json, 'minTeamSize'),
      maxTeamSize: _intValue(json, 'maxTeamSize'),
      durationWeeks: _intValue(json, 'durationWeeks'),
      description: json['description'] as String?,
      deliverables: json['deliverables'] as String?,
    );
  }

  static String _stringValue(Map<String, dynamic> json, String key) {
    final value = json[key];
    if (value is! String) {
      throw const FormatException('Thông tin dự án trả về không hợp lệ.');
    }
    return value;
  }

  static int _intValue(Map<String, dynamic> json, String key) {
    final value = json[key];
    if (value is! int) {
      throw const FormatException('Thông tin quy mô dự án không hợp lệ.');
    }
    return value;
  }
}

class ProjectPage {
  const ProjectPage({
    required this.items,
    required this.page,
    required this.pageSize,
    required this.totalItems,
    required this.totalPages,
  });

  final List<PublicProject> items;
  final int page;
  final int pageSize;
  final int totalItems;
  final int totalPages;

  factory ProjectPage.fromJson(Map<String, dynamic> json) {
    final itemsJson = json['items'];
    final pagination = json['pagination'];
    if (itemsJson is! List ||
        itemsJson.any((item) => item is! Map<String, dynamic>) ||
        pagination is! Map<String, dynamic>) {
      throw const FormatException('Danh sách dự án trả về không hợp lệ.');
    }
    return ProjectPage(
      items: itemsJson
          .cast<Map<String, dynamic>>()
          .map(PublicProject.fromJson)
          .toList(growable: false),
      page: PublicProject._intValue(pagination, 'page'),
      pageSize: PublicProject._intValue(pagination, 'pageSize'),
      totalItems: PublicProject._intValue(pagination, 'totalItems'),
      totalPages: PublicProject._intValue(pagination, 'totalPages'),
    );
  }
}

class ProjectRepository {
  const ProjectRepository(this._api);

  final ApiClient _api;

  Future<ProjectPage> search({
    required String keyword,
    required String skill,
    required int page,
    int pageSize = 20,
  }) async {
    final query = <String, String>{
      'page': '$page',
      'pageSize': '$pageSize',
      if (keyword.trim().isNotEmpty) 'keyword': keyword.trim(),
      if (skill.trim().isNotEmpty) 'skill': skill.trim(),
    };
    final response = await _api.get(
      '/talent/discovery/projects?${Uri(queryParameters: query).query}',
    );
    return ProjectPage.fromJson(response);
  }

  Future<PublicProject> getDetails(String projectId) async {
    final response = await _api.get(
      '/talent/discovery/projects/${Uri.encodeComponent(projectId)}',
    );
    return PublicProject.fromJson(response);
  }
}
