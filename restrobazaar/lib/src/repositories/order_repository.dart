import '../core/api_client.dart';
import '../models/order.dart';

class OrderRepository {
  OrderRepository(this._client);

  final ApiClient _client;

  Future<OrderModel?> createOrder(Map<String, dynamic> payload) async {
    final response = await _client.requestJson(
      '/orders',
      method: 'POST',
      data: payload,
    );

    if (response['success'] == true &&
        response['data'] is Map<String, dynamic>) {
      return OrderModel.fromJson(response['data'] as Map<String, dynamic>);
    }
    return null;
  }

  Future<List<OrderModel>> getOrders() async {
    final response = await _client.requestJson('/orders', method: 'GET');

    if (response['success'] == true && response['data'] is List) {
      final data = response['data'] as List;
      return data
          .whereType<Map<String, dynamic>>()
          .map(OrderModel.fromJson)
          .toList();
    }
    return [];
  }

  Future<OrderModel?> cancelOrder(String id) async {
    final response = await _client.requestJson(
      '/orders/$id/cancel',
      method: 'PUT',
    );

    if (response['success'] == true &&
        response['data'] is Map<String, dynamic>) {
      return OrderModel.fromJson(response['data'] as Map<String, dynamic>);
    }
    return null;
  }
}
