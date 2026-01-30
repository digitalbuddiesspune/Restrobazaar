import '../core/api_client.dart';

class NotificationRepository {
  NotificationRepository(this._client);

  final ApiClient _client;

  Future<void> registerToken({
    required String token,
    required String platform,
    String? deviceId,
  }) async {
    await _client.requestJson(
      '/notifications/token',
      method: 'POST',
      data: {
        'token': token,
        'platform': platform,
        'deviceId': deviceId,
      },
    );
  }

  Future<void> unregisterToken({required String token}) async {
    await _client.requestJson(
      '/notifications/token',
      method: 'DELETE',
      data: {'token': token},
    );
  }
}
