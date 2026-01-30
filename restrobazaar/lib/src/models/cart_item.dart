import 'product.dart';

class CartItem {
  CartItem({
    required this.id,
    required this.vendorProductId,
    required this.productId,
    required this.productName,
    required this.productImage,
    required this.vendorId,
    required this.vendorName,
    required this.cityId,
    required this.cityName,
    required this.priceType,
    required this.price,
    required this.quantity,
    this.selectedSlab,
    this.pricing,
    this.minimumOrderQuantity = 1,
    this.gstPercentage = 0,
    this.availableStock,
    this.unit,
  });

  final String id;
  final String vendorProductId;
  final String productId;
  final String productName;
  final String productImage;
  final String vendorId;
  final String vendorName;
  final String cityId;
  final String cityName;
  final String priceType;
  final double price;
  final int quantity;
  final PriceSlab? selectedSlab;
  final PricingModel? pricing;
  final int minimumOrderQuantity;
  final double gstPercentage;
  final int? availableStock;
  final String? unit;

  double get lineTotal => unitPriceForQuantity(quantity) * quantity;

  double unitPriceForQuantity(int qty) {
    if (priceType == 'bulk' && pricing?.bulk.isNotEmpty == true) {
      PriceSlab? best;
      for (final slab in pricing!.bulk) {
        final max = slab.maxQty;
        if (qty >= slab.minQty && (max == null || qty <= max)) {
          if (best == null || slab.minQty > best.minQty) {
            best = slab;
          }
        }
      }
      if (best != null) return best.price;
      final fallback = pricing!.bulk
          .reduce((a, b) => a.minQty <= b.minQty ? a : b);
      return fallback.price;
    }
    return price;
  }

  CartItem copyWith({
    String? id,
    int? quantity,
    PriceSlab? selectedSlab,
    double? price,
    PricingModel? pricing,
    double? gstPercentage,
  }) {
    return CartItem(
      id: id ?? this.id,
      vendorProductId: vendorProductId,
      productId: productId,
      productName: productName,
      productImage: productImage,
      vendorId: vendorId,
      vendorName: vendorName,
      cityId: cityId,
      cityName: cityName,
      priceType: priceType,
      price: price ?? this.price,
      quantity: quantity ?? this.quantity,
      selectedSlab: selectedSlab ?? this.selectedSlab,
      pricing: pricing ?? this.pricing,
      minimumOrderQuantity: minimumOrderQuantity,
      gstPercentage: gstPercentage ?? this.gstPercentage,
      availableStock: availableStock,
      unit: unit,
    );
  }

  factory CartItem.fromJson(Map<String, dynamic> json) {
    return CartItem(
      id: json['id']?.toString() ?? '',
      vendorProductId: json['vendorProductId']?.toString() ?? '',
      productId: json['productId']?.toString() ?? '',
      productName: json['productName']?.toString() ?? 'Product',
      productImage: json['productImage']?.toString() ?? '',
      vendorId: json['vendorId']?.toString() ?? '',
      vendorName: json['vendorName']?.toString() ?? 'Vendor',
      cityId: json['cityId']?.toString() ?? '',
      cityName: json['cityName']?.toString() ?? '',
      priceType: json['priceType']?.toString() ?? 'single',
      price: (json['price'] is num)
          ? (json['price'] as num).toDouble()
          : double.tryParse(json['price']?.toString() ?? '') ?? 0,
      quantity: json['quantity'] is num
          ? (json['quantity'] as num).toInt()
          : int.tryParse(json['quantity']?.toString() ?? '') ?? 1,
      gstPercentage: json['gstPercentage'] is num
          ? (json['gstPercentage'] as num).toDouble()
          : double.tryParse(json['gstPercentage']?.toString() ?? '') ?? 0,
      selectedSlab: json['selectedSlab'] is Map<String, dynamic>
          ? PriceSlab.fromJson(json['selectedSlab'] as Map<String, dynamic>)
          : null,
      pricing: json['pricing'] is Map<String, dynamic>
          ? PricingModel.fromJson(json['pricing'] as Map<String, dynamic>)
          : null,
      minimumOrderQuantity: json['minimumOrderQuantity'] is num
          ? (json['minimumOrderQuantity'] as num).toInt()
          : int.tryParse(json['minimumOrderQuantity']?.toString() ?? '') ?? 1,
      availableStock: json['availableStock'] is num
          ? (json['availableStock'] as num).toInt()
          : int.tryParse(json['availableStock']?.toString() ?? ''),
      unit: json['unit']?.toString(),
    );
  }

  factory CartItem.fromVendorProduct(
    VendorProductModel vendorProduct, {
    int quantity = 1,
    PriceSlab? selectedSlab,
  }) {
    final product = vendorProduct.product;
    final price =
        selectedSlab?.price ??
        vendorProduct.pricing.singlePrice ??
        (vendorProduct.pricing.bulk.isNotEmpty
            ? vendorProduct.pricing.bulk.first.price
            : 0);
    final id =
        '${vendorProduct.id}_${vendorProduct.priceType}_${price.toStringAsFixed(2)}';

    return CartItem(
      id: id,
      vendorProductId: vendorProduct.id,
      productId: product?.id ?? '',
      productName: product?.productName ?? 'Product',
      productImage: product?.images.isNotEmpty == true
          ? product!.images.first
          : '',
      vendorId: vendorProduct.vendor?.id ?? '',
      vendorName: vendorProduct.vendor?.businessName ?? 'Vendor',
      cityId: vendorProduct.city?.id ?? '',
      cityName: vendorProduct.city?.displayName ?? '',
      priceType: vendorProduct.priceType,
      price: price,
      quantity: quantity,
      selectedSlab: selectedSlab,
      pricing: vendorProduct.pricing,
      minimumOrderQuantity: vendorProduct.minimumOrderQuantity ?? 1,
      gstPercentage: vendorProduct.gst ?? 0,
      availableStock: vendorProduct.availableStock,
      unit: product?.unit,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'vendorProductId': vendorProductId,
      'productId': productId,
      'productName': productName,
      'productImage': productImage,
      'vendorId': vendorId,
      'vendorName': vendorName,
      'cityId': cityId,
      'cityName': cityName,
      'priceType': priceType,
      'price': unitPriceForQuantity(quantity),
      'quantity': quantity,
      'selectedSlab': selectedSlab?.toJson(),
      'pricing': pricing?.toJson(),
      'minimumOrderQuantity': minimumOrderQuantity,
      'gstPercentage': gstPercentage,
      'availableStock': availableStock,
      'unit': unit,
    };
  }
}
