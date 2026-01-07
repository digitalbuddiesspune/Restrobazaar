import 'address.dart';
import 'cart_item.dart';

class OrderModel {
  const OrderModel({
    required this.id,
    required this.status,
    required this.totalAmount,
    this.createdAt,
    this.items = const [],
    this.paymentMethod,
    this.paymentStatus,
    this.cartTotal,
    this.gstAmount,
    this.shippingCharges,
    this.deliveryAddress,
  });

  final String id;
  final String status;
  final double totalAmount;
  final DateTime? createdAt;
  final List<CartItem> items;
  final String? paymentMethod;
  final String? paymentStatus;
  final double? cartTotal;
  final double? gstAmount;
  final double? shippingCharges;
  final AddressModel? deliveryAddress;

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    final billing = json['billingDetails'] is Map<String, dynamic>
        ? json['billingDetails'] as Map<String, dynamic>
        : <String, dynamic>{};

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
      status: (json['orderStatus'] ?? json['status'] ?? 'created').toString(),
      totalAmount: _toDouble(json['totalAmount']) ??
          _toDouble(billing['totalAmount']) ??
          0,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
      items: items,
      paymentMethod: json['paymentMethod']?.toString(),
      paymentStatus: (json['paymentStatus'] ?? 'pending').toString(),
      cartTotal: _toDouble(json['cartTotal']) ?? _toDouble(billing['cartTotal']),
      gstAmount: _toDouble(json['gstAmount']) ?? _toDouble(billing['gstAmount']),
      shippingCharges: _toDouble(json['shippingCharges']) ??
          _toDouble(billing['shippingCharges']),
      deliveryAddress:
          json['deliveryAddress'] is Map<String, dynamic>
              ? AddressModel.fromJson(
                  json['deliveryAddress'] as Map<String, dynamic>,
                )
              : null,
    );
  }
}

double? _toDouble(dynamic value) {
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value);
  return null;
}
