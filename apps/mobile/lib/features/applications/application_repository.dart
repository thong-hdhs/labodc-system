import '../../core/api/api_client.dart';

class TalentApplication {
  const TalentApplication({
    required this.id,
    required this.projectId,
    required this.status,
    required this.createdAt,
    required this.projectTitle,
    required this.projectCode,
    required this.stateHistory,
  });

  final String id;
  final String projectId;
  final String status;
  final String createdAt;
  final String projectTitle;
  final String projectCode;
  final List<ApplicationStateChange> stateHistory;

  bool get canWithdraw =>
      !const {'ACCEPTED', 'REJECTED', 'WITHDRAWN'}.contains(status);

  factory TalentApplication.fromJson(Map<String, dynamic> json) {
    final project = json['project'];
    final history = json['stateHistory'];
    if ((project != null && project is! Map<String, dynamic>) ||
        history is! List ||
        history.any((item) => item is! Map<String, dynamic>)) {
      throw const FormatException('Thông tin đơn ứng tuyển không hợp lệ.');
    }
    final projectDetails = project is Map<String, dynamic> ? project : null;
    return TalentApplication(
      id: _requiredString(json, 'id'),
      projectId: _requiredString(json, 'projectId'),
      status: _requiredString(json, 'status'),
      createdAt: _requiredString(json, 'createdAt'),
      projectTitle: projectDetails == null
          ? 'Dự án không còn khả dụng'
          : _requiredString(projectDetails, 'title'),
      projectCode: projectDetails == null
          ? ''
          : _requiredString(projectDetails, 'code'),
      stateHistory: history
          .cast<Map<String, dynamic>>()
          .map(ApplicationStateChange.fromJson)
          .toList(growable: false),
    );
  }

  static String _requiredString(Map<String, dynamic> json, String key) {
    final value = json[key];
    if (value is! String) {
      throw const FormatException('Thông tin đơn ứng tuyển không hợp lệ.');
    }
    return value;
  }
}

class ApplicationStateChange {
  const ApplicationStateChange({
    required this.status,
    required this.createdAt,
  });

  final String status;
  final String createdAt;

  factory ApplicationStateChange.fromJson(Map<String, dynamic> json) {
    final status = json['toStatus'];
    final createdAt = json['createdAt'];
    if (status is! String || createdAt is! String) {
      throw const FormatException('Lịch sử đơn ứng tuyển không hợp lệ.');
    }
    return ApplicationStateChange(status: status, createdAt: createdAt);
  }
}

class ApplicationRepository {
  const ApplicationRepository(this._api);

  final ApiClient _api;

  Future<List<TalentApplication>> listMine(String accessToken) async {
    final records = await _api.getList(
      '/talent/me/applications',
      accessToken: accessToken,
    );
    return records
        .map(TalentApplication.fromJson)
        .toList(growable: false);
  }

  Future<void> submit(String projectId, String accessToken) async {
    await _api.post(
      '/projects/${Uri.encodeComponent(projectId)}/applications',
      accessToken: accessToken,
    );
  }

  Future<void> withdraw(String applicationId, String accessToken) async {
    await _api.post(
      '/applications/${Uri.encodeComponent(applicationId)}/withdraw',
      accessToken: accessToken,
    );
  }
}
