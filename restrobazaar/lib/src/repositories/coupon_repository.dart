import 'dart:convert';

import '../core/api_client.dart';
import '../models/cart_item.dart';
import '../models/coupon.dart';

class CouponRepository {
  CouponRepository(this._client);

  final ApiClient _client;

  Future<List<CouponModel>> getAvailableCoupons({
    String? vendorId,
    double? cartTotal,
    List<CartItem>? cartItems,
  }) async {
    final params = <String, dynamic>{};
    if (vendorId != null && vendorId.isNotEmpty) {
      params['vendorId'] = vendorId;
    }
    if (cartTotal != null) {
      params['cartTotal'] = cartTotal;
    }
    if (cartItems != null && cartItems.isNotEmpty) {
      params['cartItems'] = jsonEncode(
        cartItems.map((item) => item.toJson()).toList(),
      );
    }

    final response = await _client.requestJson(
      '/coupons/available',
      method: 'GET',
      queryParameters: params.isEmpty ? null : params,
    );

    if (response['success'] == true && response['data'] is List) {
      final data = response['data'] as List;
      return data
          .whereType<Map<String, dynamic>>()
          .map(CouponModel.fromJson)
          .toList();
    }
    return [];
  }

  Future<CouponValidationResult> validateCoupon({
    required String code,
    required double cartTotal,
    String? vendorId,
    List<CartItem>? cartItems,
  }) async {
    final payload = {
      'code': code,
      'cartTotal': cartTotal,
      if (vendorId != null && vendorId.isNotEmpty) 'vendorId': vendorId,
      if (cartItems != null && cartItems.isNotEmpty)
        'cartItems': cartItems.map((item) => item.toJson()).toList(),
    };

    final response = await _client.requestJson(
      '/coupons/validate',
      method: 'POST',
      data: payload,
    );

    if (response['success'] == true && response['data'] is Map<String, dynamic>) {
      return CouponValidationResult.fromJson(
        response['data'] as Map<String, dynamic>,
      );
    }

    throw ApiException(statusCode: null, message: 'Invalid coupon response');
  }
}
