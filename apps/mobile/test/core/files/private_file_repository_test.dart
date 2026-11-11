import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:labodc_mobile/core/api/api_client.dart';
import 'package:labodc_mobile/core/files/private_file_repository.dart';

void main() {
  test('uploads a profile avatar using the private signed upload flow', () async {
    final apiPaths = <String>[];
    final api = ApiClient(
      client: MockClient((request) async {
        apiPaths.add(request.url.path);
        if (request.url.path == '/api/v1/files/upload-intents') {
          expect(jsonDecode(request.body), {
            'category': 'AVATAR',
            'fileName': 'avatar.png',
            'mimeType': 'image/png',
            'sizeBytes': 5 * 1024 * 1024,
          });
          return http.Response(
            jsonEncode({
              'file': {'id': 'avatar-1'},
              'uploadUrl': 'https://api.cloudinary.com/v1_1/demo/image/upload',
              'uploadFields': {'signature': 'signed'},
            }),
            201,
          );
        }
        expect(request.url.path, '/api/v1/files/avatar-1/complete');
        return http.Response(
          jsonEncode({
            'id': 'avatar-1',
            'category': 'AVATAR',
            'fileName': 'avatar.png',
            'sizeBytes': 5 * 1024 * 1024,
            'status': 'UPLOADED',
          }),
          201,
        );
      }),
      baseUrl: 'https://api.example.test/api/v1',
    );
    final uploadClient = MockClient((request) async {
      expect(request.url.scheme, 'https');
      expect(request.url.host, 'api.cloudinary.com');
      expect(request, isA<http.MultipartRequest>());
      final multipart = request as http.MultipartRequest;
      expect(multipart.files.single.filename, 'avatar.png');
      expect(multipart.fields['signature'], 'signed');
      return http.Response('{}', 200);
    });
    final files = PrivateFileRepository(api, uploadClient: uploadClient);

    final uploaded = await files.uploadBytes(
      category: 'AVATAR',
      fileName: 'avatar.png',
      bytes: List<int>.filled(5 * 1024 * 1024, 1),
      accessToken: 'token',
    );

    expect(apiPaths, [
      '/api/v1/files/upload-intents',
      '/api/v1/files/avatar-1/complete',
    ]);
    expect(uploaded.category, 'AVATAR');
    expect(uploaded.status, 'UPLOADED');
    api.close();
    uploadClient.close();
  });

  test('rejects profile files beyond category limits before requesting upload', () async {
    final api = ApiClient(
      client: MockClient((_) async {
        fail('An oversized profile file must not create an upload intent.');
      }),
      baseUrl: 'https://api.example.test/api/v1',
    );
    final files = PrivateFileRepository(api);

    await expectLater(
      files.uploadBytes(
        category: 'AVATAR',
        fileName: 'avatar.jpg',
        bytes: List<int>.filled(5 * 1024 * 1024 + 1, 1),
        accessToken: 'token',
      ),
      throwsA(isA<ApiException>()),
    );
    await expectLater(
      files.uploadBytes(
        category: 'PORTFOLIO',
        fileName: 'portfolio.pdf',
        bytes: List<int>.filled(10 * 1024 * 1024 + 1, 1),
        accessToken: 'token',
      ),
      throwsA(isA<ApiException>()),
    );
    api.close();
  });
}
