import 'package:file_picker/file_picker.dart';
import 'package:http/http.dart' as http;
import 'package:url_launcher/url_launcher.dart';

import '../../core/api/api_client.dart';

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

class WorkFile {
  const WorkFile({
    required this.id,
    required this.fileName,
    required this.sizeBytes,
    required this.status,
  });

  final String id;
  final String fileName;
  final int sizeBytes;
  final String status;

  factory WorkFile.fromJson(Map<String, dynamic> json) {
    final sizeBytes = json['sizeBytes'];
    if (sizeBytes is! int) {
      throw const FormatException('Thông tin tệp đính kèm không hợp lệ.');
    }
    return WorkFile(
      id: _string(json, 'id'),
      fileName: _string(json, 'fileName'),
      sizeBytes: sizeBytes,
      status: _string(json, 'status'),
    );
  }
}

class WorkRepository {
  WorkRepository(this._api, {http.Client? uploadClient})
      : _uploadClient = uploadClient ?? http.Client();

  final ApiClient _api;
  final http.Client _uploadClient;

  static const _documentTypes = <String, String>{
    'pdf': 'application/pdf',
    'docx':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xlsx':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'csv': 'text/csv',
  };
  static const _maxDocumentBytes = 20 * 1024 * 1024;

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
  ) async {
    final records = await _api.getList(
      '/tasks/${Uri.encodeComponent(taskId)}/files',
      accessToken: accessToken,
    );
    return records.map(WorkFile.fromJson).toList(growable: false);
  }

  Future<List<WorkFile>> getReportFiles(
    String reportId,
    String accessToken,
  ) async {
    final records = await _api.getList(
      '/reports/${Uri.encodeComponent(reportId)}/files',
      accessToken: accessToken,
    );
    return records.map(WorkFile.fromJson).toList(growable: false);
  }

  Future<WorkFile?> pickAndUploadTaskDocument(
    String taskId,
    String accessToken,
  ) async {
    final selected = await _pickDocument();
    if (selected == null) return null;
    final bytes = selected.bytes;
    if (bytes == null) {
      throw const ApiException('Không đọc được nội dung tệp đã chọn.');
    }
    return uploadTaskDocument(
      taskId: taskId,
      fileName: selected.name,
      bytes: bytes,
      accessToken: accessToken,
    );
  }

  Future<WorkFile?> pickAndUploadReportDocument(
    String reportId,
    String accessToken,
  ) async {
    final selected = await _pickDocument();
    if (selected == null) return null;
    final bytes = selected.bytes;
    if (bytes == null) {
      throw const ApiException('Không đọc được nội dung tệp đã chọn.');
    }
    return uploadReportDocument(
      reportId: reportId,
      fileName: selected.name,
      bytes: bytes,
      accessToken: accessToken,
    );
  }

  Future<WorkFile> uploadTaskDocument({
    required String taskId,
    required String fileName,
    required List<int> bytes,
    required String accessToken,
  }) =>
      _uploadDocument(
        fileName: fileName,
        bytes: bytes,
        accessToken: accessToken,
        category: 'TASK_DOCUMENT',
        resourceField: 'taskId',
        resourceId: taskId,
      );

  Future<WorkFile> uploadReportDocument({
    required String reportId,
    required String fileName,
    required List<int> bytes,
    required String accessToken,
  }) =>
      _uploadDocument(
        fileName: fileName,
        bytes: bytes,
        accessToken: accessToken,
        category: 'REPORT_DOCUMENT',
        resourceField: 'reportId',
        resourceId: reportId,
      );

  Future<void> openDownload(String fileId, String accessToken) async {
    final response = await _api.get(
      '/files/${Uri.encodeComponent(fileId)}/download',
      accessToken: accessToken,
    );
    final url = response['downloadUrl'];
    if (url is! String) {
      throw const ApiException('Máy chủ không trả URL tải tệp hợp lệ.');
    }
    final uri = Uri.tryParse(url);
    if (uri == null ||
        uri.scheme != 'https' ||
        !{'api.cloudinary.com', 'res.cloudinary.com'}.contains(uri.host)) {
      throw const ApiException('URL tải tệp không an toàn.');
    }
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      throw const ApiException('Không mở được liên kết tải tệp.');
    }
  }

  Future<PlatformFile?> _pickDocument() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: _documentTypes.keys.toList(growable: false),
      withData: true,
    );
    return result?.files.single;
  }

  Future<WorkFile> _uploadDocument({
    required String fileName,
    required List<int> bytes,
    required String accessToken,
    required String category,
    required String resourceField,
    required String resourceId,
  }) async {
    final extension = fileName.split('.').last.toLowerCase();
    final mimeType = _documentTypes[extension];
    if (mimeType == null ||
        bytes.isEmpty ||
        bytes.length > _maxDocumentBytes) {
      throw const ApiException(
        'Chỉ nhận PDF, DOCX, XLSX hoặc CSV, tối đa 20 MiB.',
      );
    }

    final intent = await _api.post(
      '/files/upload-intents',
      accessToken: accessToken,
      body: {
        'category': category,
        'fileName': fileName,
        'mimeType': mimeType,
        'sizeBytes': bytes.length,
        resourceField: resourceId,
      },
    );
    final file = intent['file'];
    final uploadUrl = intent['uploadUrl'];
    final fields = intent['uploadFields'];
    if (file is! Map<String, dynamic> ||
        uploadUrl is! String ||
        fields is! Map<String, dynamic> ||
        fields.values.any((value) => value is! String)) {
      throw const ApiException('Yêu cầu tải tệp trả về không hợp lệ.');
    }
    final uploadUri = Uri.tryParse(uploadUrl);
    if (uploadUri == null ||
        uploadUri.scheme != 'https' ||
        uploadUri.host != 'api.cloudinary.com') {
      throw const ApiException('Địa chỉ tải tệp không an toàn.');
    }
    final fileId = file['id'];
    if (fileId is! String || fileId.isEmpty) {
      throw const ApiException('Máy chủ không trả mã tệp hợp lệ.');
    }

    final request = http.MultipartRequest('POST', uploadUri)
      ..fields.addAll(fields.cast<String, String>())
      ..files.add(
        http.MultipartFile.fromBytes(
          'file',
          bytes,
          filename: fileName,
        ),
      );
    final uploadResponse = await _uploadClient.send(request);
    if (uploadResponse.statusCode < 200 || uploadResponse.statusCode >= 300) {
      throw ApiException(
        'Cloudinary từ chối tệp (${uploadResponse.statusCode}); chưa hoàn tất đăng ký tệp.',
        statusCode: uploadResponse.statusCode,
      );
    }

    final completed = await _api.post(
      '/files/${Uri.encodeComponent(fileId)}/complete',
      accessToken: accessToken,
    );
    return WorkFile.fromJson(completed);
  }

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
