import '../core/api_client.dart';
import '../models/city.dart';

class CityRepository {
  CityRepository(this._client);

  final ApiClient _client;

  Future<List<CityModel>> getServiceableCities() async {
    final response = await _client.requestJson(
      '/cities/serviceable',
      method: 'GET',
    );

    if (response['success'] == true && response['data'] is List) {
      final data = response['data'] as List;
      return data
          .whereType<Map<String, dynamic>>()
          .map(CityModel.fromJson)
          .toList();
    }
    return [];
  }
}
