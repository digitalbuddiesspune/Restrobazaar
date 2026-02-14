import 'address.dart';
import 'cart_item.dart';

class OrderModel {
  const OrderModel({
    required this.id,
    required this.status,
    required this.totalAmount,
    this.orderNumber,
    this.invoiceNumber,
    this.createdAt,
    this.items = const [],
    this.paymentMethod,
    this.paymentStatus,
    this.cartTotal,
    this.gstAmount,
    this.shippingCharges,
    this.couponAmount,
    this.couponCode,
    this.gstNumber,
    this.billingDetails,
    this.vendor,
    this.deliveryAddress,
  });

  final String id;
  final String status;
  final double totalAmount;
  final String? orderNumber;
  final String? invoiceNumber;
  final DateTime? createdAt;
  final List<CartItem> items;
  final String? paymentMethod;
  final String? paymentStatus;
  final double? cartTotal;
  final double? gstAmount;
  final double? shippingCharges;
  final double? couponAmount;
  final String? couponCode;
  final String? gstNumber;
  final OrderBillingDetails? billingDetails;
  final OrderVendorInfo? vendor;
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
              'gstPercentage': merged['gstPercentage'] ?? merged['gst'] ?? 0,
              'gstAmount': merged['gstAmount'],
              'hsnCode':
                  merged['hsnCode'] ??
                  merged['hsn'] ??
                  merged['product']?['hsnCode'] ??
                  merged['vendorProduct']?['productId']?['hsnCode'],
              'minimumOrderQuantity': merged['minimumOrderQuantity'] ?? 1,
            }),
          );
        }
      }
    }

    return OrderModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      status: (json['orderStatus'] ?? json['status'] ?? 'created').toString(),
      orderNumber: json['orderNumber']?.toString(),
      invoiceNumber: json['invoiceNumber']?.toString(),
      totalAmount:
          _toDouble(json['totalAmount']) ??
          _toDouble(billing['totalAmount']) ??
          0,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
      items: items,
      paymentMethod: json['paymentMethod']?.toString(),
      paymentStatus: (json['paymentStatus'] ?? 'pending').toString(),
      cartTotal:
          _toDouble(json['cartTotal']) ?? _toDouble(billing['cartTotal']),
      gstAmount:
          _toDouble(json['gstAmount']) ?? _toDouble(billing['gstAmount']),
      shippingCharges:
          _toDouble(json['shippingCharges']) ??
          _toDouble(billing['shippingCharges']),
      couponAmount:
          _toDouble(json['couponAmount']) ??
          _toDouble(billing['couponDiscount']),
      couponCode: json['couponCode']?.toString(),
      gstNumber: (json['deliveryAddress'] is Map<String, dynamic>)
          ? (json['deliveryAddress'] as Map<String, dynamic>)['gstNumber']
                ?.toString()
          : null,
      billingDetails: billing.isNotEmpty
          ? OrderBillingDetails.fromJson(billing)
          : null,
      vendor: json['vendorId'] is Map<String, dynamic>
          ? OrderVendorInfo.fromJson(json['vendorId'] as Map<String, dynamic>)
          : null,
      deliveryAddress: json['deliveryAddress'] is Map<String, dynamic>
          ? AddressModel.fromJson(
              json['deliveryAddress'] as Map<String, dynamic>,
            )
          : null,
    );
  }
}

class OrderBillingDetails {
  const OrderBillingDetails({
    required this.cartTotal,
    required this.gstAmount,
    required this.shippingCharges,
    required this.totalAmount,
  });

  final double cartTotal;
  final double gstAmount;
  final double shippingCharges;
  final double totalAmount;

  factory OrderBillingDetails.fromJson(Map<String, dynamic> json) {
    return OrderBillingDetails(
      cartTotal: _toDouble(json['cartTotal']) ?? 0,
      gstAmount: _toDouble(json['gstAmount']) ?? 0,
      shippingCharges: _toDouble(json['shippingCharges']) ?? 0,
      totalAmount: _toDouble(json['totalAmount']) ?? 0,
    );
  }
}

class OrderVendorInfo {
  const OrderVendorInfo({
    required this.businessName,
    this.email,
    this.gstNumber,
    this.state,
    this.bankDetails,
  });

  final String businessName;
  final String? email;
  final String? gstNumber;
  final String? state;
  final OrderVendorBankDetails? bankDetails;

  factory OrderVendorInfo.fromJson(Map<String, dynamic> json) {
    final address = json['address'];
    final state = address is Map<String, dynamic>
        ? address['state']?.toString()
        : null;
    return OrderVendorInfo(
      businessName: (json['businessName'] ?? 'AK Enterprises').toString(),
      email: json['email']?.toString(),
      gstNumber: json['gstNumber']?.toString(),
      state: state,
      bankDetails: json['bankDetails'] is Map<String, dynamic>
          ? OrderVendorBankDetails.fromJson(
              json['bankDetails'] as Map<String, dynamic>,
            )
          : null,
    );
  }
}

class OrderVendorBankDetails {
  const OrderVendorBankDetails({
    this.bankName,
    this.accountHolderName,
    this.accountNumber,
    this.branch,
    this.ifsc,
    this.upiId,
  });

  final String? bankName;
  final String? accountHolderName;
  final String? accountNumber;
  final String? branch;
  final String? ifsc;
  final String? upiId;

  factory OrderVendorBankDetails.fromJson(Map<String, dynamic> json) {
    return OrderVendorBankDetails(
      bankName: json['bankName']?.toString(),
      accountHolderName: json['accountHolderName']?.toString(),
      accountNumber: json['accountNumber']?.toString(),
      branch: json['branch']?.toString(),
      ifsc: json['ifsc']?.toString(),
      upiId: json['upiId']?.toString(),
    );
  }
}

double? _toDouble(dynamic value) {
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value);
  return null;
}
