import '../core/api_client.dart';
import '../models/user.dart';

class AuthRepository {
  AuthRepository(this._client);

  final ApiClient _client;

  Future<UserModel> signIn({
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
      return UserModel.fromJson(response['data'] as Map<String, dynamic>);
    }

    throw ApiException(
      statusCode: 400,
      message: response['message']?.toString() ?? 'Unable to sign in',
    );
  }

  Future<UserModel> signUp({
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
      return UserModel.fromJson(response['data'] as Map<String, dynamic>);
    }

    throw ApiException(
      statusCode: 400,
      message: response['message']?.toString() ?? 'Unable to sign up',
    );
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
