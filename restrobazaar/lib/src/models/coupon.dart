class CouponModel {
  const CouponModel({
    required this.id,
    required this.code,
    required this.discountType,
    required this.discountValue,
    required this.minimumOrderAmount,
    this.description,
    this.maxDiscount,
    this.estimatedDiscount,
  });

  final String id;
  final String code;
  final String discountType;
  final double discountValue;
  final double minimumOrderAmount;
  final String? description;
  final double? maxDiscount;
  final double? estimatedDiscount;

  factory CouponModel.fromJson(Map<String, dynamic> json) {
    return CouponModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      code: json['code']?.toString() ?? '',
      discountType: json['discountType']?.toString() ?? 'fixed',
      discountValue: _toDouble(json['discountValue']) ?? 0,
      minimumOrderAmount: _toDouble(json['minimumOrderAmount']) ?? 0,
      description: json['description']?.toString(),
      maxDiscount: _toDouble(json['maxDiscount']),
      estimatedDiscount: _toDouble(json['estimatedDiscount']),
    );
  }
}

class CouponValidationResult {
  const CouponValidationResult({
    required this.couponId,
    required this.code,
    required this.discount,
    required this.discountType,
    required this.discountValue,
    required this.finalAmount,
  });

  final String couponId;
  final String code;
  final double discount;
  final String discountType;
  final double discountValue;
  final double finalAmount;

  factory CouponValidationResult.fromJson(Map<String, dynamic> json) {
    return CouponValidationResult(
      couponId: json['couponId']?.toString() ?? '',
      code: json['code']?.toString() ?? '',
      discount: _toDouble(json['discount']) ?? 0,
      discountType: json['discountType']?.toString() ?? 'fixed',
      discountValue: _toDouble(json['discountValue']) ?? 0,
      finalAmount: _toDouble(json['finalAmount']) ?? 0,
    );
  }
}

double? _toDouble(dynamic value) {
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value);
  return null;
}
