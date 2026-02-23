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

  Future<void> sendOtpForLogin({required String phone}) async {
    final response = await _client.requestJson(
      '/users/send-otp-login',
      method: 'POST',
      data: {'phone': phone},
    );

    if (response['success'] == true) {
      return;
    }

    throw ApiException(
      statusCode: 400,
      message:
          response['message']?.toString() ?? 'Failed to send OTP. Try again.',
    );
  }

  Future<AuthResult> verifyOtpLogin({
    required String phone,
    required String otp,
  }) async {
    final response = await _client.requestJson(
      '/users/verify-otp-login',
      method: 'POST',
      data: {'phone': phone, 'otp': otp},
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
      message: response['message']?.toString() ?? 'OTP verification failed',
    );
  }

  Future<void> sendOtpForSignup({required String phone}) async {
    final response = await _client.requestJson(
      '/users/send-otp-signup',
      method: 'POST',
      data: {'phone': phone},
    );

    if (response['success'] == true) {
      return;
    }

    throw ApiException(
      statusCode: 400,
      message:
          response['message']?.toString() ?? 'Failed to send OTP. Try again.',
    );
  }

  Future<AuthResult> verifyOtpSignup({
    required String name,
    required String phone,
    required String otp,
    String? restaurantName,
    String? gstNumber,
  }) async {
    final response = await _client.requestJson(
      '/users/verify-otp-signup',
      method: 'POST',
      data: {
        'name': name,
        'phone': phone,
        'otp': otp,
        if (restaurantName != null && restaurantName.isNotEmpty)
          'restaurantName': restaurantName,
        if (gstNumber != null && gstNumber.isNotEmpty) 'gstNumber': gstNumber,
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
      message: response['message']?.toString() ?? 'OTP verification failed',
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

  Future<UserModel?> updateUserProfile({
    required String userId,
    String? restaurantName,
    String? gstNumber,
  }) async {
    final response = await _client.requestJson(
      '/users/$userId',
      method: 'PUT',
      data: {
        if (restaurantName != null) 'restaurantName': restaurantName,
        if (gstNumber != null) 'gstNumber': gstNumber,
      },
    );

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
