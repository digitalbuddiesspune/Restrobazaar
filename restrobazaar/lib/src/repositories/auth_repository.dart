import '../core/api_client.dart';
import '../models/user.dart';

class AuthRepository {
  AuthRepository(this._client);

  final ApiClient _client;

  Future<AuthResult> signIn({
    required String email,
    required String password,
  }) async {
    final response = await _client.requestJson(
      '/users/signin',
      method: 'POST',
      data: {'email': email, 'password': password},
    );

    if (response['success'] == true &&
        response['data'] is Map<String, dynamic>) {
      final data = response['data'] as Map<String, dynamic>;
      return AuthResult(
        user: UserModel.fromJson(data),
        token: _extractToken(response, data),
      );
    }

    throw ApiException(
      statusCode: 400,
      message: response['message']?.toString() ?? 'Unable to sign in',
    );
  }

  Future<AuthResult> signUp({
    required String name,
    required String email,
    required String password,
    String? phone,
  }) async {
    final response = await _client.requestJson(
      '/users/signup',
      method: 'POST',
      data: {
        'name': name,
        'email': email,
        'password': password,
        if (phone != null && phone.isNotEmpty) 'phone': phone,
      },
    );

    if (response['success'] == true &&
        response['data'] is Map<String, dynamic>) {
      final data = response['data'] as Map<String, dynamic>;
      return AuthResult(
        user: UserModel.fromJson(data),
        token: _extractToken(response, data),
      );
    }

    throw ApiException(
      statusCode: 400,
      message: response['message']?.toString() ?? 'Unable to sign up',
    );
  }

  String? _extractToken(
    Map<String, dynamic> response, [
    Map<String, dynamic>? data,
  ]) {
    final candidates = <dynamic>[
      response['token'],
      response['accessToken'],
      response['access_token'],
      response['jwt'],
      if (data != null) ...[
        data['token'],
        data['accessToken'],
        data['access_token'],
        data['jwt'],
      ],
    ];

    for (final candidate in candidates) {
      if (candidate is String && candidate.isNotEmpty) {
        return candidate;
      }
    }

    return null;
  }

  Future<UserModel?> fetchCurrentUser() async {
    final response = await _client.requestJson('/users/me', method: 'GET');

    if (response['success'] == true &&
        response['data'] is Map<String, dynamic>) {
      return UserModel.fromJson(response['data'] as Map<String, dynamic>);
    }
    return null;
  }

  Future<void> logout() async {
    await _client.request('/users/logout', method: 'POST');
  }
}

class AuthResult {
  const AuthResult({required this.user, this.token});

  final UserModel user;
  final String? token;
}
