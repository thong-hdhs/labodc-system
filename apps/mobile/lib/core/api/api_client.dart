import 'dart:convert';

import 'package:http/http.dart' as http;

class ApiException implements Exception {
  const ApiException(this.message, {this.statusCode = 0});

  final String message;
  final int statusCode;

  @override
  String toString() => message;
}

class ApiClient {
  ApiClient({http.Client? client, String? baseUrl})
      : _client = client ?? http.Client(),
        _baseUrl = (baseUrl ??
                const String.fromEnvironment(
                  'API_BASE_URL',
                  defaultValue: 'http://10.0.2.2:3000/api/v1',
                ))
            .replaceFirst(RegExp(r'/$'), '');

  final http.Client _client;
  final String _baseUrl;

  Future<Map<String, dynamic>> get(
    String path, {
    String? accessToken,
  }) =>
      _sendMap('GET', path, accessToken: accessToken);

  Future<List<Map<String, dynamic>>> getList(
    String path, {
    String? accessToken,
  }) =>
      _sendList('GET', path, accessToken: accessToken);

  Future<Map<String, dynamic>> post(
    String path, {
    String? accessToken,
    Map<String, Object?>? body,
  }) =>
      _sendMap('POST', path, accessToken: accessToken, body: body);

  Future<Map<String, dynamic>> put(
    String path, {
    String? accessToken,
    Map<String, Object?>? body,
  }) =>
      _sendMap('PUT', path, accessToken: accessToken, body: body);

  Future<Map<String, dynamic>> patch(
    String path, {
    String? accessToken,
    Map<String, Object?>? body,
  }) =>
      _sendMap('PATCH', path, accessToken: accessToken, body: body);

  void close() => _client.close();

  Future<Map<String, dynamic>> _sendMap(
    String method,
    String path, {
    String? accessToken,
    Map<String, Object?>? body,
  }) async {
    final decoded = await _sendRaw(
      method,
      path,
      accessToken: accessToken,
      body: body,
    );
    if (decoded is Map<String, dynamic>) return decoded;
    throw const ApiException('Máy chủ trả về cấu trúc phản hồi không hợp lệ.');
  }

  Future<List<Map<String, dynamic>>> _sendList(
    String method,
    String path, {
    String? accessToken,
  }) async {
    final decoded = await _sendRaw(method, path, accessToken: accessToken);
    if (decoded is! List ||
        decoded.any((item) => item is! Map<String, dynamic>)) {
      throw const ApiException('Máy chủ trả về danh sách không hợp lệ.');
    }
    return decoded.cast<Map<String, dynamic>>();
  }

  Future<Object?> _sendRaw(
    String method,
    String path, {
    String? accessToken,
    Map<String, Object?>? body,
  }) async {
    final uri = Uri.parse('$_baseUrl$path');
    final headers = <String, String>{'Accept': 'application/json'};
    if (body != null) headers['Content-Type'] = 'application/json';
    if (accessToken != null) {
      headers['Authorization'] = 'Bearer $accessToken';
    }

    late final http.Response response;
    try {
      switch (method) {
        case 'GET':
          response = await _client.get(uri, headers: headers);
          break;
        case 'POST':
          response = await _client.post(
            uri,
            headers: headers,
            body: body == null ? null : jsonEncode(body),
          );
          break;
        case 'PUT':
          response = await _client.put(
            uri,
            headers: headers,
            body: body == null ? null : jsonEncode(body),
          );
          break;
        case 'PATCH':
          response = await _client.patch(
            uri,
            headers: headers,
            body: body == null ? null : jsonEncode(body),
          );
          break;
        default:
          throw StateError('Unsupported HTTP method: $method');
      }
    } on ApiException {
      rethrow;
    } catch (error) {
      throw ApiException('Không thể kết nối máy chủ LabOdc: $error');
    }

    Object? decoded;
    try {
      decoded = response.body.isEmpty ? <String, dynamic>{} : jsonDecode(response.body);
    } on FormatException {
      throw ApiException(
        'Máy chủ trả về dữ liệu không đúng định dạng.',
        statusCode: response.statusCode,
      );
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      final message =
          decoded is Map<String, dynamic> ? decoded['message'] : null;
      throw ApiException(
        message is String
            ? message
            : message is List
                ? message.whereType<String>().join('\n')
                : 'Yêu cầu thất bại (${response.statusCode}).',
        statusCode: response.statusCode,
      );
    }
    return decoded;
  }
}
