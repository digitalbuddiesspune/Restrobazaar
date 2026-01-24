import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../controllers/catalog_providers.dart';
import '../../controllers/city_controller.dart';
import '../../widgets/product_card.dart';
import '../../widgets/city_selector_sheet.dart';
import '../../models/category.dart';
import '../../models/product.dart';

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

          return productsAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, _) => Center(child: Text(error.toString())),
            data: (products) {
              final filtered = _selectedSubCategory == 'all'
                  ? products
                  : products.where((p) {
                      final sub =
                          p.subCategory ?? p.product?.subCategory ?? '';
                      return sub.trim().toLowerCase() ==
                          _selectedSubCategory.trim().toLowerCase();
                    }).toList();

              return Container(
                color: Colors.grey.shade50,
                child: SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _CategoryHeaderCard(
                        category: category,
                        subcategories: category.subCategories,
                        selected: _selectedSubCategory,
                        onSelect: (value) {
                          setState(() => _selectedSubCategory = value);
                        },
                      ),
                      const SizedBox(height: 14),
                      if (filtered.isEmpty)
                        _EmptyProducts(
                          title: 'No products found',
                          subtitle:
                              'No products available in ${cityState.selected?.displayName ?? 'your city'} for this category',
                        )
                      else
                        _ProductGrid(
                          products: filtered,
                          onTap: (id) => context.push('/product/$id'),
                        ),
                    ],
                  ),
                ),
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text(error.toString())),
      ),
    );
  }
}

class _CategoryHeaderCard extends StatelessWidget {
  const _CategoryHeaderCard({
    required this.category,
    required this.subcategories,
    required this.selected,
    required this.onSelect,
  });

  final CategoryModel category;
  final List<String> subcategories;
  final String selected;
  final void Function(String value) onSelect;

  @override
  Widget build(BuildContext context) {
    final chips = <Widget>[
      _SubcategoryChip(
        label: 'All',
        selected: selected == 'all',
        onTap: () => onSelect('all'),
      ),
      ...subcategories.map(
        (sub) => _SubcategoryChip(
          label: sub,
          selected: selected == sub,
          onTap: () => onSelect(sub),
        ),
      ),
    ];

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 12,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                height: 56,
                width: 56,
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey.shade200),
                  image: category.image != null && category.image!.isNotEmpty
                      ? DecorationImage(
                          image: NetworkImage(category.image!),
                          fit: BoxFit.cover,
                          onError: (_, __) {},
                        )
                      : null,
                ),
                child: category.image == null || category.image!.isEmpty
                    ? Icon(
                        Icons.category_outlined,
                        color: Colors.grey.shade500,
                        size: 26,
                      )
                    : null,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      category.name,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Browse curated products in ${category.name}.',
                      style: TextStyle(
                        color: Colors.grey.shade600,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Divider(height: 1, color: Colors.grey.shade300),
          const SizedBox(height: 12),
          const Text(
            'Filter by Subcategory:',
            style: TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 13,
              color: Color(0xFF374151),
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            height: 34,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: chips.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, index) => chips[index],
            ),
          ),
        ],
      ),
    );
  }
}

class _SubcategoryChip extends StatelessWidget {
  const _SubcategoryChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: selected ? const Color(0xFFdc2626) : Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: selected ? const Color(0xFFdc2626) : Colors.grey.shade200,
          ),
          boxShadow: selected
              ? [
                  BoxShadow(
                    color: Colors.red.withOpacity(0.2),
                    blurRadius: 8,
                    offset: const Offset(0, 4),
                  ),
                ]
              : null,
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? Colors.white : const Color(0xFF374151),
            fontWeight: FontWeight.w600,
            fontSize: 11,
          ),
        ),
      ),
    );
  }
}

class _ProductGrid extends StatelessWidget {
  const _ProductGrid({required this.products, required this.onTap});

  final List<VendorProductModel> products;
  final void Function(String id) onTap;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        const crossAxisCount = 2;
        const spacing = 12.0;
        final totalWidth = constraints.maxWidth;
        final itemWidth =
            (totalWidth - (spacing * (crossAxisCount - 1))) / crossAxisCount;
        final itemHeight = itemWidth + 170;

        return GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          padding: const EdgeInsets.all(4),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: crossAxisCount,
            mainAxisSpacing: spacing,
            crossAxisSpacing: spacing,
            mainAxisExtent: itemHeight,
          ),
          itemCount: products.length,
          itemBuilder: (context, index) {
            final product = products[index];
            return ProductCard(
              product: product,
              onTap: () => onTap(product.id),
            );
          },
        );
      },
    );
  }
}

class _EmptyProducts extends StatelessWidget {
  const _EmptyProducts({required this.title, required this.subtitle});

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 32),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 14,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        children: [
          Icon(
            Icons.inventory_2_outlined,
            size: 56,
            color: Colors.grey.shade400,
          ),
          const SizedBox(height: 12),
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontWeight: FontWeight.w800,
              fontSize: 18,
              color: Color(0xFF374151),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Color(0xFF6b7280),
              fontSize: 14,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }
}
