import '../core/api_client.dart';
import '../models/testimonial.dart';

class TestimonialRepository {
  TestimonialRepository(this._client);

  final ApiClient _client;

  Future<List<TestimonialModel>> getTestimonials({
    bool? status,
    int limit = 100,
    int page = 1,
  }) async {
    final query = <String, dynamic>{
      'limit': limit,
      'page': page,
    };
    if (status != null) {
      query['status'] = status.toString();
    }

    final response = await _client.requestJson(
      '/testimonials',
      method: 'GET',
      queryParameters: query,
    );

    if (response['success'] == true && response['data'] is List) {
      final data = response['data'] as List;
      return data
          .whereType<Map<String, dynamic>>()
          .map(TestimonialModel.fromJson)
          .toList();
    }
    return [];
  }
}
