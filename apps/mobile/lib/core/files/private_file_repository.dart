import 'package:file_picker/file_picker.dart';
import 'package:http/http.dart' as http;
import 'package:url_launcher/url_launcher.dart';

import '../api/api_client.dart';

class PrivateFile {
  const PrivateFile({
    required this.id,
    required this.category,
    required this.fileName,
    required this.sizeBytes,
    required this.status,
  });

  final String id;
  final String category;
  final String fileName;
  final int sizeBytes;
  final String status;

  factory PrivateFile.fromJson(Map<String, dynamic> json) {
    final sizeBytes = json['sizeBytes'];
    if (sizeBytes is! int) {
      throw const FormatException('Thông tin tệp đính kèm không hợp lệ.');
    }
    return PrivateFile(
      id: _string(json, 'id'),
      category: _string(json, 'category'),
      fileName: _string(json, 'fileName'),
      sizeBytes: sizeBytes,
      status: _string(json, 'status'),
    );
  }
}

abstract interface class ProfileFileStore {
  Future<List<PrivateFile>> listMine(String accessToken);
  Future<PrivateFile?> pickAndUploadAvatar(String accessToken);
  Future<PrivateFile?> pickAndUploadPortfolio(String accessToken);
  Future<void> openDownload(String fileId, String accessToken);
}

abstract interface class WorkFileStore {
  Future<List<PrivateFile>> getTaskFiles(String taskId, String accessToken);
  Future<List<PrivateFile>> getReportFiles(String reportId, String accessToken);
  Future<PrivateFile?> pickAndUploadTaskDocument(
    String taskId,
    String accessToken,
  );
  Future<PrivateFile?> pickAndUploadReportDocument(
    String reportId,
    String accessToken,
  );
  Future<void> openDownload(String fileId, String accessToken);
}

class PrivateFileRepository implements ProfileFileStore, WorkFileStore {
  PrivateFileRepository(this._api, {http.Client? uploadClient})
      : _uploadClient = uploadClient ?? http.Client();

  final ApiClient _api;
  final http.Client _uploadClient;

  static const _mimeTypes = <String, String>{
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'pdf': 'application/pdf',
    'docx':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xlsx':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'csv': 'text/csv',
  };
  static const _limits = <String, int>{
    'AVATAR': 5 * 1024 * 1024,
    'PORTFOLIO': 10 * 1024 * 1024,
    'TASK_DOCUMENT': 20 * 1024 * 1024,
    'REPORT_DOCUMENT': 20 * 1024 * 1024,
  };
  static const _extensions = <String, List<String>>{
    'AVATAR': ['jpg', 'jpeg', 'png'],
    'PORTFOLIO': ['pdf', 'jpg', 'jpeg', 'png'],
    'TASK_DOCUMENT': ['pdf', 'docx', 'xlsx', 'csv'],
    'REPORT_DOCUMENT': ['pdf', 'docx', 'xlsx', 'csv'],
  };

  @override
  Future<List<PrivateFile>> listMine(String accessToken) async {
    final files = await _api.getList(
      '/talent/me/files',
      accessToken: accessToken,
    );
    return files.map(PrivateFile.fromJson).toList(growable: false);
  }

  @override
  Future<List<PrivateFile>> getTaskFiles(
    String taskId,
    String accessToken,
  ) async {
    final files = await _api.getList(
      '/tasks/${Uri.encodeComponent(taskId)}/files',
      accessToken: accessToken,
    );
    return files.map(PrivateFile.fromJson).toList(growable: false);
  }

  @override
  Future<List<PrivateFile>> getReportFiles(
    String reportId,
    String accessToken,
  ) async {
    final files = await _api.getList(
      '/reports/${Uri.encodeComponent(reportId)}/files',
      accessToken: accessToken,
    );
    return files.map(PrivateFile.fromJson).toList(growable: false);
  }

  @override
  Future<PrivateFile?> pickAndUploadAvatar(String accessToken) =>
      _pickAndUpload('AVATAR', accessToken);

  @override
  Future<PrivateFile?> pickAndUploadPortfolio(String accessToken) =>
      _pickAndUpload('PORTFOLIO', accessToken);

  @override
  Future<PrivateFile?> pickAndUploadTaskDocument(
    String taskId,
    String accessToken,
  ) =>
      _pickAndUpload(
        'TASK_DOCUMENT',
        accessToken,
        resourceField: 'taskId',
        resourceId: taskId,
      );

  @override
  Future<PrivateFile?> pickAndUploadReportDocument(
    String reportId,
    String accessToken,
  ) =>
      _pickAndUpload(
        'REPORT_DOCUMENT',
        accessToken,
        resourceField: 'reportId',
        resourceId: reportId,
      );

  @override
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

  Future<PrivateFile?> _pickAndUpload(
    String category,
    String accessToken, {
    String? resourceField,
    String? resourceId,
  }) async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: _extensions[category],
      withData: true,
    );
    final selected = result?.files.single;
    if (selected == null) return null;
    final bytes = selected.bytes;
    if (bytes == null) {
      throw const ApiException('Không đọc được nội dung tệp đã chọn.');
    }
    return uploadBytes(
      category: category,
      fileName: selected.name,
      bytes: bytes,
      accessToken: accessToken,
      resourceField: resourceField,
      resourceId: resourceId,
    );
  }

  Future<PrivateFile> uploadBytes({
    required String category,
    required String fileName,
    required List<int> bytes,
    required String accessToken,
    String? resourceField,
    String? resourceId,
  }) async {
    final extension = fileName.split('.').last.toLowerCase();
    final mimeType = _mimeTypes[extension];
    final maximumBytes = _limits[category];
    if (mimeType == null ||
        maximumBytes == null ||
        !_extensions[category]!.contains(extension) ||
        bytes.isEmpty ||
        bytes.length > maximumBytes) {
      throw ApiException('Loại hoặc kích thước tệp không hợp lệ cho $category.');
    }
    if ((category == 'TASK_DOCUMENT' || category == 'REPORT_DOCUMENT') &&
        (resourceField == null ||
            resourceId == null ||
            (resourceField != 'taskId' && resourceField != 'reportId'))) {
      throw const ApiException('Thiếu liên kết Task/Report cho tệp.');
    }

    final intent = await _api.post(
      '/files/upload-intents',
      accessToken: accessToken,
      body: {
        'category': category,
        'fileName': fileName,
        'mimeType': mimeType,
        'sizeBytes': bytes.length,
        if (resourceField != null && resourceId != null)
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
    return PrivateFile.fromJson(completed);
  }
}

String _string(Map<String, dynamic> json, String key) {
  final value = json[key];
  if (value is! String) {
    throw const FormatException('Thông tin tệp đính kèm không hợp lệ.');
  }
  return value;
}
