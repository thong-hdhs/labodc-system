class AuthUser {
  const AuthUser({
    required this.id,
    required this.email,
    required this.fullName,
    required this.role,
    required this.status,
  });

  final String id;
  final String email;
  final String fullName;
  final String role;
  final String status;

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: _requiredString(json, 'id'),
      email: _requiredString(json, 'email'),
      fullName: _requiredString(json, 'fullName'),
      role: _requiredString(json, 'role'),
      status: _requiredString(json, 'status'),
    );
  }

  Map<String, String> toJson() => {
        'id': id,
        'email': email,
        'fullName': fullName,
        'role': role,
        'status': status,
      };

  static String _requiredString(Map<String, dynamic> json, String key) {
    final value = json[key];
    if (value is! String || value.isEmpty) {
      throw const FormatException('Thông tin tài khoản trả về không hợp lệ.');
    }
    return value;
  }
}

class AuthSession {
  const AuthSession({required this.user, required this.accessToken});

  final AuthUser user;
  final String accessToken;
}
