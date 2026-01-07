import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../controllers/cart_controller.dart';
import '../../controllers/catalog_providers.dart';
import '../../controllers/wishlist_controller.dart';
import '../../core/formatters.dart';
import '../../models/product.dart';

class ProductDetailScreen extends ConsumerStatefulWidget {
  const ProductDetailScreen({super.key, required this.productId});

  final String productId;

  @override
  ConsumerState<ProductDetailScreen> createState() =>
      _ProductDetailScreenState();
}

class _ProductDetailScreenState extends ConsumerState<ProductDetailScreen> {
  int _quantity = 1;
  PriceSlab? _selectedSlab;

  @override
  Widget build(BuildContext context) {
    final productAsync = ref.watch(productDetailProvider(widget.productId));
    final wishlistState = ref.watch(wishlistControllerProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Product details'),
        actions: [
          IconButton(
            onPressed: () => context.push('/cart'),
            icon: const Icon(Icons.shopping_cart_outlined),
          ),
        ],
      ),
      body: productAsync.when(
        data: (product) {
          if (product == null) {
            return const Center(child: Text('Product not found'));
          }

          final images = product.product?.images ?? [];
          final price =
              _selectedSlab?.price ??
              product.pricing.singlePrice ??
              (product.pricing.bulk.isNotEmpty
                  ? product.pricing.bulk.first.price
                  : 0);
          final inWishlist = wishlistState.contains(product.id);
          final minQty = product.minimumOrderQuantity ?? 1;

          return SingleChildScrollView(
            padding: const EdgeInsets.only(bottom: 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                AspectRatio(
                  aspectRatio: 1,
                  child: PageView.builder(
                    itemCount: images.isEmpty ? 1 : images.length,
                    itemBuilder: (context, index) {
                      final imageUrl = images.isNotEmpty
                          ? images[index]
                          : 'https://via.placeholder.com/600x600?text=Product';
                      return CachedNetworkImage(
                        imageUrl: imageUrl,
                        fit: BoxFit.cover,
                        errorWidget: (context, _, __) => Container(
                          color: Colors.grey.shade200,
                          alignment: Alignment.center,
                          child: const Icon(Icons.image),
                        ),
                      );
                    },
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        product.product?.productName ?? 'Product',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        product.vendor?.businessName ?? '',
                        style: TextStyle(color: Colors.grey.shade600),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        price > 0 ? formatCurrency(price) : 'Price on request',
                        style: Theme.of(context).textTheme.headlineSmall
                            ?.copyWith(
                              color: Theme.of(context).colorScheme.primary,
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      if (product.pricing.bulk.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Wrap(
                            spacing: 8,
                            children: product.pricing.bulk.map((slab) {
                              final selected =
                                  _selectedSlab?.minQty == slab.minQty &&
                                  _selectedSlab?.maxQty == slab.maxQty &&
                                  _selectedSlab?.price == slab.price;
                              final label =
                                  '${slab.minQty}-${slab.maxQty ?? '∞'} pcs • ${formatCurrency(slab.price)}';
                              return ChoiceChip(
                                label: Text(label),
                                selected: selected,
                                onSelected: (_) {
                                  setState(() => _selectedSlab = slab);
                                },
                              );
                            }).toList(),
                          ),
                        ),
                      const SizedBox(height: 16),
                      if (product.availableStock != null)
                        Row(
                          children: [
                            Icon(
                              product.availableStock! > 0
                                  ? Icons.check_circle
                                  : Icons.error,
                              color: product.availableStock! > 0
                                  ? Colors.green
                                  : Colors.red,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              product.availableStock! > 0
                                  ? 'In stock'
                                  : 'Out of stock',
                            ),
                          ],
                        ),
                      const SizedBox(height: 16),
                      if (product.product?.shortDescription != null)
                        Text(product.product!.shortDescription!),
                      if (product.product?.description != null) ...[
                        const SizedBox(height: 12),
                        Text(
                          product.product!.description!,
                          style: TextStyle(color: Colors.grey.shade700),
                        ),
                      ],
                      const SizedBox(height: 20),
                      Row(
                        children: [
                          const Text(
                            'Quantity',
                            style: TextStyle(fontWeight: FontWeight.w600),
                          ),
                          const SizedBox(width: 12),
                          Container(
                            decoration: BoxDecoration(
                              color: Colors.grey.shade100,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Row(
                              children: [
                                IconButton(
                                  onPressed: _quantity > minQty
                                      ? () => setState(() => _quantity--)
                                      : null,
                                  icon: const Icon(Icons.remove),
                                ),
                                Text('$_quantity'),
                                IconButton(
                                  onPressed: () => setState(() => _quantity++),
                                  icon: const Icon(Icons.add),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () async {
                                await ref
                                    .read(cartControllerProvider.notifier)
                                    .addToCart(
                                      product,
                                      quantity: _quantity,
                                      selectedSlab: _selectedSlab,
                                    );
                                if (!context.mounted) return;
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('Added to cart'),
                                    duration: Duration(seconds: 1),
                                  ),
                                );
                              },
                              child: const Text('Add to cart'),
                            ),
                          ),
                          const SizedBox(width: 12),
                          IconButton.filledTonal(
                            onPressed: () async {
                              await ref
                                  .read(wishlistControllerProvider.notifier)
                                  .toggleWishlist(product);
                            },
                            icon: Icon(
                              inWishlist
                                  ? Icons.favorite
                                  : Icons.favorite_border,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text(error.toString())),
      ),
    );
  }
}
