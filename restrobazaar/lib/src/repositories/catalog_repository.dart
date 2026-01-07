import '../core/api_client.dart';
import '../models/category.dart';
import '../models/product.dart';

class CatalogRepository {
  CatalogRepository(this._client);

  final ApiClient _client;

  Future<List<CategoryModel>> getCategories() async {
    final response = await _client.requestJson(
      '/categories',
      method: 'GET',
      queryParameters: {'isActive': 'true'},
    );

    if (response['success'] == true && response['data'] is List) {
      final data = response['data'] as List;
      return data
          .whereType<Map<String, dynamic>>()
          .map(CategoryModel.fromJson)
          .toList();
    }
    return [];
  }

  Future<CategoryModel?> getCategoryBySlug(String slug) async {
    final response = await _client.requestJson(
      '/categories/slug/$slug',
      method: 'GET',
    );

    if (response['success'] == true &&
        response['data'] is Map<String, dynamic>) {
      return CategoryModel.fromJson(response['data'] as Map<String, dynamic>);
    }
    return null;
  }

  Future<List<VendorProductModel>> getVendorProducts({
    String? cityId,
    String? categoryId,
    int page = 1,
    int limit = 20,
    String? search,
  }) async {
    final query = <String, dynamic>{
      'status': 'true',
      'page': page,
      'limit': limit,
    };
    if (cityId != null && cityId.isNotEmpty) query['cityId'] = cityId;
    if (categoryId != null && categoryId.isNotEmpty) {
      query['categoryId'] = categoryId;
    }
    if (search != null && search.isNotEmpty) {
      query['q'] = search;
    }

    final bool hasCategory = categoryId != null && categoryId.isNotEmpty;
    final bool hasCity = cityId != null && cityId.isNotEmpty;

    // If category is provided but no city selected, fall back to generic endpoint with category filter.
    final String path;
    if (hasCategory && hasCity) {
      path = '/vendor-products/city/$cityId/category/$categoryId';
    } else {
      path = '/vendor-products';
    }

    final response = await _client.requestJson(
      path,
      method: 'GET',
      queryParameters: query,
    );

    if (response['success'] == true) {
      final data = response['data'];
      if (data is List) {
        return data
            .whereType<Map<String, dynamic>>()
            .map(VendorProductModel.fromJson)
            .toList();
      }
    }
    return [];
  }

  Future<VendorProductModel?> getVendorProductById(String id) async {
    final response = await _client.requestJson(
      '/vendor-products/$id',
      method: 'GET',
    );
    if (response['success'] == true) {
      if (response['data'] is Map<String, dynamic>) {
        return VendorProductModel.fromJson(
          response['data'] as Map<String, dynamic>,
        );
      }
    }
    return null;
  }

  Future<List<VendorProductModel>> searchProducts({
    required String query,
    String? cityId,
    int page = 1,
    int limit = 20,
  }) async {
    final response = await _client.requestJson(
      '/vendor-products/search',
      method: 'GET',
      queryParameters: {
        'q': query,
        if (cityId != null && cityId.isNotEmpty) 'cityId': cityId,
        'status': 'true',
        'page': page,
        'limit': limit,
      },
    );

    if (response['success'] == true && response['data'] is List) {
      final data = response['data'] as List;
      return data
          .whereType<Map<String, dynamic>>()
          .map(VendorProductModel.fromJson)
          .toList();
    }
    return [];
  }
}
