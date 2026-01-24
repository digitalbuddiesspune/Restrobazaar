import 'category.dart';
import 'city.dart';

class ProductModel {
  const ProductModel({
    required this.id,
    required this.productName,
    this.shortDescription,
    this.description,
    this.images = const [],
    this.unit,
    this.subCategory,
    this.category,
  });

  final String id;
  final String productName;
  final String? shortDescription;
  final String? description;
  final List<String> images;
  final String? unit;
  final String? subCategory;
  final CategoryModel? category;

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    final rawImages = json['images'] ?? [];
    return ProductModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      productName: (json['productName'] ?? json['name'] ?? '').toString(),
      shortDescription: json['shortDescription']?.toString(),
      description: json['description']?.toString(),
      images: rawImages is List
          ? rawImages
                .map(
                  (e) => (e is Map && e['url'] != null)
                      ? e['url'].toString()
                      : e.toString(),
                )
                .toList()
          : const [],
      unit: json['unit']?.toString(),
      subCategory: json['subCategory']?.toString(),
      category: json['category'] is Map<String, dynamic>
          ? CategoryModel.fromJson(json['category'] as Map<String, dynamic>)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'productName': productName,
      'shortDescription': shortDescription,
      'description': description,
      'images': images,
      'unit': unit,
      'subCategory': subCategory,
      'category': category?.toJson(),
    };
  }
}

class VendorModel {
  const VendorModel({required this.id, required this.businessName});

  final String id;
  final String businessName;

  factory VendorModel.fromJson(Map<String, dynamic> json) {
    return VendorModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      businessName: (json['businessName'] ?? json['name'] ?? 'Vendor')
          .toString(),
    );
  }

  Map<String, dynamic> toJson() => {'id': id, 'businessName': businessName};
}

class PriceSlab {
  const PriceSlab({required this.price, required this.minQty, this.maxQty});

  final double price;
  final int minQty;
  final int? maxQty;

  factory PriceSlab.fromJson(Map<String, dynamic> json) {
    return PriceSlab(
      price: _toDouble(json['price']),
      minQty: (json['minQty'] ?? json['min'] ?? 1) is num
          ? (json['minQty'] ?? json['min'] ?? 1).toInt()
          : int.tryParse(json['minQty']?.toString() ?? '') ?? 1,
      maxQty: json['maxQty'] == null
          ? null
          : ((json['maxQty'] is num)
                ? (json['maxQty'] as num).toInt()
                : int.tryParse(json['maxQty'].toString())),
    );
  }

  Map<String, dynamic> toJson() => {
    'price': price,
    'minQty': minQty,
    'maxQty': maxQty,
  };
}

class PricingModel {
  const PricingModel({this.singlePrice, this.bulk = const []});

  final double? singlePrice;
  final List<PriceSlab> bulk;

  factory PricingModel.fromJson(Map<String, dynamic>? json) {
    if (json == null) return const PricingModel();
    final bulk = <PriceSlab>[];
    final rawBulk = json['bulk'];
    if (rawBulk is List) {
      for (final entry in rawBulk) {
        if (entry is Map<String, dynamic>) {
          bulk.add(PriceSlab.fromJson(entry));
        }
      }
    }

    final single = json['single'];
    final singlePrice = single is Map<String, dynamic>
        ? single['price']
        : json['price'];

    return PricingModel(
      singlePrice: singlePrice != null ? _toDouble(singlePrice) : null,
      bulk: bulk,
    );
  }

  Map<String, dynamic> toJson() => {
    'singlePrice': singlePrice,
    'bulk': bulk.map((e) => e.toJson()).toList(),
  };
}

class VendorProductModel {
  VendorProductModel({
    required this.id,
    this.slug,
    this.product,
    this.vendor,
    this.city,
    this.priceType = 'single',
    PricingModel? pricing,
    this.availableStock,
    this.minimumOrderQuantity,
    this.subCategory,
    this.originalPrice,
  }) : pricing = pricing ?? const PricingModel();

  final String id;
  final String? slug;
  final ProductModel? product;
  final VendorModel? vendor;
  final CityModel? city;
  final String priceType;
  final PricingModel pricing;
  final int? availableStock;
  final int? minimumOrderQuantity;
  final String? subCategory;
  final double? originalPrice;

  factory VendorProductModel.fromJson(Map<String, dynamic> json) {
    Map<String, dynamic>? productJson = json['productId'] is Map<String, dynamic>
        ? json['productId'] as Map<String, dynamic>
        : null;
    productJson ??=
        json['product'] is Map<String, dynamic> ? json['product'] as Map<String, dynamic> : null;
    // Some responses return the product fields directly (wishlist API)
    productJson ??= json['images'] is List ? json : null;

    final vendorJson = json['vendorId'] is Map<String, dynamic>
        ? json['vendorId'] as Map<String, dynamic>
        : null;
    final cityJson = json['cityId'] is Map<String, dynamic>
        ? json['cityId'] as Map<String, dynamic>
        : null;

    final pricingJson =
        json['pricing'] is Map<String, dynamic> ? json['pricing'] as Map<String, dynamic> : null;
    final inferredPricing = pricingJson != null
        ? PricingModel.fromJson(pricingJson)
        : PricingModel(
            singlePrice: json['price'] != null ? _toDouble(json['price']) : null,
          );

    final minimumOrderRaw =
        json['minimumOrderQuantity'] ?? productJson?['minimumOrderQuantity'];

    return VendorProductModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      slug: json['slug']?.toString(),
      product: productJson != null ? ProductModel.fromJson(productJson) : null,
      vendor: vendorJson != null ? VendorModel.fromJson(vendorJson) : null,
      city: cityJson != null ? CityModel.fromJson(cityJson) : null,
      priceType: (json['priceType'] ?? 'single').toString(),
      pricing: inferredPricing,
      availableStock: json['availableStock'] is num
          ? (json['availableStock'] as num).toInt()
          : int.tryParse(json['availableStock']?.toString() ?? ''),
      minimumOrderQuantity: minimumOrderRaw is num
          ? minimumOrderRaw.toInt()
          : int.tryParse(minimumOrderRaw?.toString() ?? ''),
      subCategory:
          json['subCategory']?.toString() ??
          productJson?['subCategory']?.toString(),
      originalPrice:
          json['originalPrice'] != null ? _toDouble(json['originalPrice']) : null,
    );
  }

  double? get displayPrice {
    if (priceType == 'single' && pricing.singlePrice != null) {
      return pricing.singlePrice;
    }
    if (priceType == 'bulk' && pricing.bulk.isNotEmpty) {
      return pricing.bulk.first.price;
    }
    return null;
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'slug': slug,
      'productId': product?.toJson(),
      'vendorId': vendor?.toJson(),
      'cityId': city?.toJson(),
      'priceType': priceType,
      'pricing': pricing.toJson(),
      'availableStock': availableStock,
      'minimumOrderQuantity': minimumOrderQuantity,
      'subCategory': subCategory,
      'originalPrice': originalPrice,
    };
  }
}

double _toDouble(dynamic value) {
  if (value == null) return 0;
  if (value is num) return value.toDouble();
  return double.tryParse(value.toString()) ?? 0;
}
