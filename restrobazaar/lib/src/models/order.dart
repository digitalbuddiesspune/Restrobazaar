import 'cart_item.dart';

class OrderModel {
  const OrderModel({
    required this.id,
    required this.status,
    required this.totalAmount,
    this.createdAt,
    this.items = const [],
    this.paymentMethod,
  });

  final String id;
  final String status;
  final double totalAmount;
  final DateTime? createdAt;
  final List<CartItem> items;
  final String? paymentMethod;

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'] ?? json['products'];
    final items = <CartItem>[];
    if (rawItems is List) {
      for (final item in rawItems) {
        if (item is Map<String, dynamic>) {
          final vendorProduct = item['vendorProduct'] ?? item['product'];
          final merged = <String, dynamic>{};
          merged.addAll(item);
          if (vendorProduct is Map<String, dynamic>) {
            merged['productName'] =
                vendorProduct['name'] ?? vendorProduct['productName'];
            merged['productImage'] = vendorProduct['images']?[0];
          }
          items.add(
            CartItem.fromJson({
              'id': merged['id'] ?? merged['_id'] ?? '',
              'vendorProductId':
                  merged['vendorProductId'] ??
                  merged['vendorProduct']?['_id'] ??
                  '',
              'productId':
                  merged['productId'] ??
                  merged['product']?['_id'] ??
                  vendorProduct?['_id'] ??
                  '',
              'productName': merged['productName'] ?? 'Product',
              'productImage': merged['productImage'] ?? '',
              'vendorId': merged['vendorId'] ?? '',
              'vendorName': merged['vendorName'] ?? '',
              'cityId': merged['cityId'] ?? '',
              'cityName': merged['cityName'] ?? '',
              'priceType': merged['priceType'] ?? 'single',
              'price': merged['price'] ?? 0,
              'quantity': merged['quantity'] ?? 1,
              'minimumOrderQuantity': merged['minimumOrderQuantity'] ?? 1,
            }),
          );
        }
      }
    }

    return OrderModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      status: (json['status'] ?? 'created').toString(),
      totalAmount: (json['totalAmount'] is num)
          ? (json['totalAmount'] as num).toDouble()
          : double.tryParse(json['totalAmount']?.toString() ?? '') ?? 0,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
      items: items,
      paymentMethod: json['paymentMethod']?.toString(),
    );
  }
}
