import '../../core/api/api_client.dart';
import '../../core/files/private_file_repository.dart';

typedef WorkFile = PrivateFile;

class TalentTeam {
  const TalentTeam({
    required this.id,
    required this.status,
    required this.projectTitle,
    required this.projectCode,
    required this.members,
  });

  final String id;
  final String status;
  final String projectTitle;
  final String projectCode;
  final List<TeamMember> members;

  factory TalentTeam.fromJson(Map<String, dynamic> json) {
    final project = json['project'];
    final members = json['members'];
    if (project is! Map<String, dynamic> ||
        members is! List ||
        members.any((member) => member is! Map<String, dynamic>)) {
      throw const FormatException('Thông tin nhóm/dự án không hợp lệ.');
    }
    return TalentTeam(
      id: _string(json, 'id'),
      status: _string(json, 'status'),
      projectTitle: _string(project, 'title'),
      projectCode: _string(project, 'code'),
      members: members
          .cast<Map<String, dynamic>>()
          .map(TeamMember.fromJson)
          .toList(growable: false),
    );
  }
}

class TeamMember {
  const TeamMember({
    required this.userId,
    required this.fullName,
    required this.role,
  });

  final String userId;
  final String fullName;
  final String role;

  factory TeamMember.fromJson(Map<String, dynamic> json) {
    return TeamMember(
      userId: _string(json, 'userId'),
      fullName: _string(json, 'fullName'),
      role: _string(json, 'role'),
    );
  }
}

class AssignedTask {
  const AssignedTask({
    required this.id,
    required this.title,
    required this.description,
    required this.status,
    required this.assignmentType,
    required this.assignedUserId,
    required this.templateVersion,
    required this.dueAt,
  });

  final String id;
  final String title;
  final String description;
  final String status;
  final String? assignmentType;
  final String? assignedUserId;
  final String templateVersion;
  final String? dueAt;

  bool get canStart =>
      assignmentType != null &&
      (status == 'ASSIGNED' || status == 'CHANGES_REQUESTED');
  bool get canSubmit => assignmentType != null && status == 'IN_PROGRESS';

  factory AssignedTask.fromJson(Map<String, dynamic> json) {
    return AssignedTask(
      id: _string(json, 'id'),
      title: _string(json, 'title'),
      description: _string(json, 'description'),
      status: _string(json, 'status'),
      assignmentType: _nullableString(json, 'assignmentType'),
      assignedUserId: _nullableString(json, 'assignedUserId'),
      templateVersion: _string(json, 'templateVersion'),
      dueAt: _nullableString(json, 'dueAt'),
    );
  }
}

class TalentReport {
  const TalentReport({
    required this.id,
    required this.authorUserId,
    required this.periodType,
    required this.periodStart,
    required this.periodEnd,
    required this.summary,
    required this.progress,
    required this.blockers,
    required this.nextSteps,
    required this.status,
    required this.reviewNote,
  });

  final String id;
  final String authorUserId;
  final String periodType;
  final String periodStart;
  final String periodEnd;
  final String summary;
  final String progress;
  final String blockers;
  final String nextSteps;
  final String status;
  final String? reviewNote;

  bool get canSubmit => status == 'DRAFT' || status == 'CHANGES_REQUESTED';

  factory TalentReport.fromJson(Map<String, dynamic> json) {
    return TalentReport(
      id: _string(json, 'id'),
      authorUserId: _string(json, 'authorUserId'),
      periodType: _string(json, 'periodType'),
      periodStart: _string(json, 'periodStart'),
      periodEnd: _string(json, 'periodEnd'),
      summary: _string(json, 'summary'),
      progress: _string(json, 'progress'),
      blockers: _string(json, 'blockers'),
      nextSteps: _string(json, 'nextSteps'),
      status: _string(json, 'status'),
      reviewNote: _nullableString(json, 'reviewNote'),
    );
  }
}

class WorkRepository {
  WorkRepository(this._api, {PrivateFileRepository? fileRepository})
      : files = fileRepository ?? PrivateFileRepository(_api);

  final ApiClient _api;
  final PrivateFileRepository files;

  Future<TalentTeam> getMyTeam(String accessToken) async {
    return TalentTeam.fromJson(
      await _api.get('/talent/me/team', accessToken: accessToken),
    );
  }

  Future<List<AssignedTask>> getMyTasks(String accessToken) async {
    final records =
        await _api.getList('/talent/me/tasks', accessToken: accessToken);
    return records.map(AssignedTask.fromJson).toList(growable: false);
  }

  Future<List<TalentReport>> getMyReports(String accessToken) async {
    final records =
        await _api.getList('/talent/me/reports', accessToken: accessToken);
    return records.map(TalentReport.fromJson).toList(growable: false);
  }

  Future<List<WorkFile>> getTaskFiles(
    String taskId,
    String accessToken,
  ) =>
      files.getTaskFiles(taskId, accessToken);

  Future<List<WorkFile>> getReportFiles(
    String reportId,
    String accessToken,
  ) =>
      files.getReportFiles(reportId, accessToken);

  Future<WorkFile?> pickAndUploadTaskDocument(
    String taskId,
    String accessToken,
  ) =>
      files.pickAndUploadTaskDocument(taskId, accessToken);

  Future<WorkFile?> pickAndUploadReportDocument(
    String reportId,
    String accessToken,
  ) =>
      files.pickAndUploadReportDocument(reportId, accessToken);

  Future<WorkFile> uploadTaskDocument({
    required String taskId,
    required String fileName,
    required List<int> bytes,
    required String accessToken,
  }) =>
      files.uploadBytes(
        category: 'TASK_DOCUMENT',
        resourceField: 'taskId',
        resourceId: taskId,
        fileName: fileName,
        bytes: bytes,
        accessToken: accessToken,
      );

  Future<WorkFile> uploadReportDocument({
    required String reportId,
    required String fileName,
    required List<int> bytes,
    required String accessToken,
  }) =>
      files.uploadBytes(
        category: 'REPORT_DOCUMENT',
        resourceField: 'reportId',
        resourceId: reportId,
        fileName: fileName,
        bytes: bytes,
        accessToken: accessToken,
      );

  Future<void> openDownload(String fileId, String accessToken) =>
      files.openDownload(fileId, accessToken);

  Future<void> startTask(String taskId, String accessToken) async {
    await _api.post(
      '/talent/tasks/${Uri.encodeComponent(taskId)}/start',
      accessToken: accessToken,
    );
  }

  Future<void> submitTask({
    required String taskId,
    required String content,
    required String templateVersion,
    required String accessToken,
  }) async {
    await _api.post(
      '/talent/tasks/${Uri.encodeComponent(taskId)}/submissions',
      accessToken: accessToken,
      body: {'content': content, 'templateVersion': templateVersion},
    );
  }

  Future<void> createTeamReport({
    required String periodStart,
    required String periodEnd,
    required String summary,
    required String progress,
    required String blockers,
    required String nextSteps,
    required String accessToken,
  }) async {
    await _api.post(
      '/talent/me/reports',
      accessToken: accessToken,
      body: {
        'periodType': 'MONTH',
        'periodStart': periodStart,
        'periodEnd': periodEnd,
        'summary': summary,
        'progress': progress,
        'blockers': blockers,
        'nextSteps': nextSteps,
      },
    );
  }

  Future<void> submitReport(String reportId, String accessToken) async {
    await _api.post(
      '/reports/${Uri.encodeComponent(reportId)}/submit',
      accessToken: accessToken,
    );
  }
}

String _string(Map<String, dynamic> json, String key) {
  final value = json[key];
  if (value is! String) {
    throw const FormatException('Dữ liệu công việc trả về không hợp lệ.');
  }
  return value;
}

String? _nullableString(Map<String, dynamic> json, String key) {
  final value = json[key];
  if (value != null && value is! String) {
    throw const FormatException('Dữ liệu công việc trả về không hợp lệ.');
  }
  return value is String ? value : null;
}
