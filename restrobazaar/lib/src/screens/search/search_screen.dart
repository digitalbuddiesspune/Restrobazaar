import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../controllers/catalog_providers.dart';
import '../../controllers/city_controller.dart';
import '../../models/product.dart';
import '../../widgets/product_card.dart';
import '../../widgets/categories_nav_bar.dart';

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key, this.initialQuery});

  final String? initialQuery;

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  late TextEditingController _controller;
  String _query = '';

  @override
  void initState() {
    super.initState();
    _query = widget.initialQuery ?? '';
    _controller = TextEditingController(text: _query);
  }

  @override
  Widget build(BuildContext context) {
    final city = ref.watch(cityControllerProvider).selected;
    final AsyncValue<List<VendorProductModel>> productsAsync = _query.isEmpty
        ? const AsyncData<List<VendorProductModel>>([])
        : ref.watch(
            searchProductsProvider(
              VendorProductsParams(search: _query, cityId: city?.id),
            ),
          );

    return Scaffold(
      appBar: AppBar(
        title: TextField(
          controller: _controller,
          autofocus: true,
          textInputAction: TextInputAction.search,
          onSubmitted: (value) {
            setState(() => _query = value.trim());
          },
          decoration: const InputDecoration(hintText: 'Search for products...'),
        ),
        bottom: const CategoriesNavBar(),
        actions: [
          IconButton(
            onPressed: () => context.go('/cart'),
            icon: const Icon(Icons.shopping_cart_outlined),
          ),
        ],
      ),
      body: productsAsync.when(
        data: (products) {
          if (_query.isEmpty) {
            return const Center(
              child: Text('Start typing to search the catalog'),
            );
          }
          if (products.isEmpty) {
            return Center(child: Text('No results for "$_query"'));
          }
          return LayoutBuilder(
            builder: (context, constraints) {
              const crossAxisCount = 2;
              const spacing = 12.0;
              final totalWidth = constraints.maxWidth;
              final itemWidth =
                  (totalWidth - (spacing * (crossAxisCount - 1))) /
                      crossAxisCount;
              final itemHeight = itemWidth + 145;

              return GridView.builder(
                padding: const EdgeInsets.all(16),
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
                    onTap: () => context.push('/product/${product.id}'),
                  );
                },
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
