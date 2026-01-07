import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../controllers/catalog_providers.dart';
import '../../controllers/city_controller.dart';
import '../../widgets/product_card.dart';
import '../../widgets/city_selector_sheet.dart';

class CategoryScreen extends ConsumerStatefulWidget {
  const CategoryScreen({super.key, required this.slug});

  final String slug;

  @override
  ConsumerState<CategoryScreen> createState() => _CategoryScreenState();
}

class _CategoryScreenState extends ConsumerState<CategoryScreen> {
  String _selectedSubCategory = 'all';

  @override
  Widget build(BuildContext context) {
    final categoryAsync = ref.watch(categoryBySlugProvider(widget.slug));
    final cityState = ref.watch(cityControllerProvider);
    final cityId = cityState.selected?.id;

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.slug.replaceAll('-', ' ')),
        actions: [
          IconButton(
            onPressed: () => context.push('/search'),
            icon: const Icon(Icons.search),
          ),
          IconButton(
            onPressed: () => context.go('/cart'),
            icon: const Icon(Icons.shopping_cart_outlined),
          ),
        ],
      ),
      body: categoryAsync.when(
        data: (category) {
          if (category == null) {
            return const Center(child: Text('Category not found'));
          }

          if (cityId == null || cityId.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text(
                      'Select your city to view products in this category.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      onPressed: () {
                        showModalBottomSheet<void>(
                          context: context,
                          isScrollControlled: true,
                          builder: (_) => const CitySelectorSheet(),
                        );
                      },
                      child: const Text('Choose city'),
                    ),
                  ],
                ),
              ),
            );
          }

          final productsAsync = ref.watch(
            vendorProductsProvider(
              VendorProductsParams(
                cityId: cityId,
                categoryId: category.id,
                page: 1,
                limit: 200,
              ),
            ),
          );

          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (category.subCategories.isNotEmpty)
                SizedBox(
                  height: 46,
                  child: ListView.separated(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    scrollDirection: Axis.horizontal,
                    itemBuilder: (context, index) {
                      final subCat = index == 0
                          ? 'all'
                          : category.subCategories[index - 1];
                      return ChoiceChip(
                        label: Text(index == 0 ? 'All' : subCat),
                        selected: _selectedSubCategory == subCat,
                        onSelected: (_) {
                          setState(() => _selectedSubCategory = subCat);
                        },
                      );
                    },
                    separatorBuilder: (_, __) => const SizedBox(width: 8),
                    itemCount: category.subCategories.length + 1,
                  ),
                ),
              Expanded(
                child: productsAsync.when(
                  data: (products) {
                    final filtered = _selectedSubCategory == 'all'
                        ? products
                        : products.where((p) {
                            final sub =
                                p.subCategory ?? p.product?.subCategory ?? '';
                            return sub.trim().toLowerCase() ==
                                _selectedSubCategory.trim().toLowerCase();
                          }).toList();

                    if (filtered.isEmpty) {
                      return const Center(child: Text('No products found'));
                    }

                    return GridView.builder(
                      padding: const EdgeInsets.all(16),
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            childAspectRatio: 0.68,
                            mainAxisSpacing: 12,
                            crossAxisSpacing: 12,
                          ),
                      itemCount: filtered.length,
                      itemBuilder: (context, index) {
                        final product = filtered[index];
                        return ProductCard(
                          product: product,
                          onTap: () => context.push('/product/${product.id}'),
                        );
                      },
                    );
                  },
                  loading: () =>
                      const Center(child: CircularProgressIndicator()),
                  error: (error, _) => Center(child: Text(error.toString())),
                ),
              ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text(error.toString())),
      ),
    );
  }
}
