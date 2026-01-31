import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/category.dart';
import '../models/product.dart';
import '../repositories/repository_providers.dart';

final categoriesProvider = FutureProvider<List<CategoryModel>>((ref) async {
  final repo = ref.read(catalogRepositoryProvider);
  final categories = await repo.getCategories();
  return categories;
});

class VendorProductsParams {
  const VendorProductsParams({
    this.cityId,
    this.categoryId,
    this.page = 1,
    this.limit = 20,
    this.search,
  });

  final String? cityId;
  final String? categoryId;
  final int page;
  final int limit;
  final String? search;

  @override
  int get hashCode =>
      Object.hash(cityId, categoryId, page, limit, search ?? '');

  @override
  bool operator ==(Object other) {
    return other is VendorProductsParams &&
        other.cityId == cityId &&
        other.categoryId == categoryId &&
        other.page == page &&
        other.limit == limit &&
        other.search == search;
  }
}

final vendorProductsProvider =
    FutureProvider.family<List<VendorProductModel>, VendorProductsParams>((
      ref,
      params,
    ) async {
      final repo = ref.read(catalogRepositoryProvider);
      return repo.getVendorProducts(
        cityId: params.cityId,
        categoryId: params.categoryId,
        page: params.page,
        limit: params.limit,
        search: params.search,
      );
    });

final productDetailProvider =
    FutureProvider.family<VendorProductModel?, String>((ref, id) async {
      final repo = ref.read(catalogRepositoryProvider);
      return repo.getVendorProductById(id);
    });

final categoryBySlugProvider = FutureProvider.family<CategoryModel?, String>((
  ref,
  slug,
) async {
  final repo = ref.read(catalogRepositoryProvider);
  final categories = await repo.getCategories();
  final match = categories.firstWhere(
    (c) => c.slug == slug,
    orElse: () => const CategoryModel(id: '', name: '', slug: ''),
  );
  if (match.id.isNotEmpty) return match;
  return repo.getCategoryBySlug(slug);
});

final searchProductsProvider =
    FutureProvider.family<List<VendorProductModel>, VendorProductsParams>((
      ref,
      params,
    ) async {
      final repo = ref.read(catalogRepositoryProvider);
      return repo.searchProducts(
        query: params.search ?? '',
        cityId: params.cityId,
        page: params.page,
        limit: params.limit,
      );
    });
