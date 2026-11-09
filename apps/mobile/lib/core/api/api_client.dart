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
      _send('GET', path, accessToken: accessToken);

  Future<Map<String, dynamic>> post(
    String path, {
    String? accessToken,
    Map<String, Object?>? body,
  }) =>
      _send('POST', path, accessToken: accessToken, body: body);

  Future<Map<String, dynamic>> put(
    String path, {
    String? accessToken,
    Map<String, Object?>? body,
  }) =>
      _send('PUT', path, accessToken: accessToken, body: body);

  void close() => _client.close();

  Future<Map<String, dynamic>> _send(
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

    if (decoded is! Map<String, dynamic>) {
      throw ApiException(
        'Máy chủ trả về cấu trúc phản hồi không hợp lệ.',
        statusCode: response.statusCode,
      );
    }
    if (response.statusCode < 200 || response.statusCode >= 300) {
      final message = decoded['message'];
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
