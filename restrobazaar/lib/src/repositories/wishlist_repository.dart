import '../core/api_client.dart';
import '../models/product.dart';

class WishlistRepository {
  WishlistRepository(this._client);

  final ApiClient _client;

  Future<List<VendorProductModel>> getWishlist() async {
    final response = await _client.requestJson(
      '/users/wishlist',
      method: 'GET',
    );

    if (response['success'] == true &&
        response['data'] is Map<String, dynamic>) {
      final data = response['data'] as Map<String, dynamic>;
      final products = data['products'];
      if (products is List) {
        return products
            .whereType<Map<String, dynamic>>()
            .map(VendorProductModel.fromJson)
            .toList();
      }
    }
    return [];
  }

  Future<void> addToWishlist(String productId) async {
    await _client.request(
      '/users/wishlist',
      method: 'POST',
      data: {'productId': productId},
    );
  }

  Future<void> removeFromWishlist(String productId) async {
    await _client.request('/users/wishlist/$productId', method: 'DELETE');
  }
}
